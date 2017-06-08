import * as cls from 'continuation-local-storage';

import * as amqp from 'amqplib';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as os from 'os';
import uuid = require('uuid');

import { RpcOptions } from '../controllers/rpc-decorator';
import { sanitize, validate } from '../middleware/schema.middleware';
import { AbstractError, AbstractFatalError, AbstractLogicError, FatalError, ISLAND, LogicError } from '../utils/error';
import { logger } from '../utils/logger';
import reviver from '../utils/reviver';
import { TraceLog } from '../utils/tracelog';
import { AmqpChannelPoolService } from './amqp-channel-pool-service';

const RPC_EXEC_TIMEOUT_MS = parseInt(process.env.ISLAND_RPC_EXEC_TIMEOUT_MS, 10) || 25000;
const RPC_WAIT_TIMEOUT_MS = parseInt(process.env.ISLAND_RPC_WAIT_TIMEOUT_MS, 10) || 60000;
const SERVICE_LOAD_TIME_MS = parseInt(process.env.ISLAND_SERVICE_LOAD_TIME_MS, 10) || 60000;
const RPC_QUEUE_EXPIRES_MS = RPC_WAIT_TIMEOUT_MS + SERVICE_LOAD_TIME_MS;

export interface IConsumerInfo {
  channel: amqp.Channel;
  tag: string;
  options?: RpcOptions;
  key: string;
  consumer: (msg: any) => Promise<void>;
  consumerOpts?: any;
}

interface Message {
  content: Buffer;
  properties: amqp.Options.Publish;
}

interface IRpcResponse {
  version: number;
  result: boolean;
  body?: AbstractError | any;
}

export interface RpcRequest {
  name: string;
  msg: any;
  options: RpcOptions;
}

class RpcResponse {
  static reviver: ((k, v) => any) | undefined = reviver;
  static encode(body: any, serviceName: string): Buffer {
    const res: IRpcResponse = {
      body,
      result: body instanceof Error ? false : true,
      version: 1
    };

    return new Buffer(JSON.stringify(res, (k, v: AbstractError | number | boolean) => {
      // TODO instanceof Error should AbstractError
      if (v instanceof Error) {
        const e = v as AbstractError;
        return {
          debugMsg: e.debugMsg,
          errorCode: e.errorCode,
          errorKey: e.errorKey,
          errorNumber: e.errorNumber,
          errorType: e.errorType,
          extra: e.extra,
          message: e.message,
          name: e.name,
          occurredIn: e.occurredIn || serviceName,
          stack: e.stack,
          statusCode: e.statusCode
        };
      }
      return v;
    }), 'utf8');
  }

  static decode(msg: Buffer): IRpcResponse {
    if (!msg) return { version: 0, result: false };
    try {
      const res: IRpcResponse = JSON.parse(msg.toString('utf8'), RpcResponse.reviver);
      if (!res.result) res.body = this.getAbstractError(res.body);

      return res;
    } catch (e) {
      logger.notice('[decode error]', e);
      return { version: 0, result: false };
    }
  }

 static getAbstractError(err: AbstractError): AbstractError {
    let result: AbstractError;
    const enumObj = {};
    enumObj[err.errorNumber] = err.errorKey;
    const occurredIn = err.extra && err.extra.island || err.occurredIn;
    switch (err.errorType) {
      case 'LOGIC':
        result = new AbstractLogicError(err.errorNumber, err.debugMsg, occurredIn, enumObj);
        break;
      case 'FATAL':
        result = new AbstractFatalError(err.errorNumber, err.debugMsg, occurredIn, enumObj);
        break;
      default:
        result = new AbstractError('ETC', 1, err.message, occurredIn, { 1: 'F0001' });
        result.name = 'ETCError';
    }

    result.statusCode = err.statusCode;
    result.stack = err.stack;
    result.extra = err.extra;
    result.occurredIn = err.occurredIn;

    return result;
  }
}

function enterScope(properties: any, func): Promise<any> {
  return new Promise((resolve, reject) => {
    const ns = cls.getNamespace('app');
    ns.run(() => {
      _.each(properties, (value, key: string) => {
        ns.set(key, value);
      });
      Bluebird.try(func).then(resolve).catch(reject);
    });
  });
}

// [TODO] should be (value: T) => Promise<T>
export type RpcHook = (rpc) => Promise<any>;
export enum RpcHookType {
  PRE_ENDPOINT,
  POST_ENDPOINT,
  PRE_RPC,
  POST_RPC,
  PRE_ENDPOINT_ERROR,
  POST_ENDPOINT_ERROR,
  PRE_RPC_ERROR,
  POST_RPC_ERROR
}

export interface InitializeOptions {
  noReviver?: boolean;
}

function createTraceLog({ tattoo, timestamp, msg, headers, rpcName, serviceName }) {
  const log = new TraceLog(tattoo, timestamp);
  log.size = msg.content.byteLength;
  log.from = headers.from;
  log.to = { node: process.env.HOSTNAME, context: rpcName, island: serviceName, type: 'rpc' };
  return log;
}

function sanitizeAndValidate(content, rpcOptions) {
  if (rpcOptions) {
    if (_.get(rpcOptions, 'schema.query.sanitization')) {
      content = sanitize(rpcOptions.schema!.query!.sanitization, content);
    }
    if (_.get(rpcOptions, 'schema.query.validation')) {
      if (!validate(rpcOptions.schema!.query!.validation, content)) {
        throw new LogicError(ISLAND.LOGIC.L0002_WRONG_PARAMETER_SCHEMA, `Wrong parameter schema`);
      }
    }
  }
  return content;
}

function sanitizeAndValidateResult(res, rpcOptions?: RpcOptions) {
  if (!rpcOptions) return res;
  if (_.get(rpcOptions, 'schema.result.sanitization')) {
    res = sanitize(rpcOptions.schema!.result!.sanitization, res);
  }
  if (_.get(rpcOptions, 'schema.result.validation')) {
    validate(rpcOptions.schema!.result!.validation, res);
  }
  return res;
}

function nackWithDelay(channel, msg) {
  setTimeout(() => channel.nack(msg), 1000) as any;
  return;
}

type RequestExecutor = { resolve: (msg: Message) => any, reject: (e: Error) => any };

export default class RPCService {
  private consumerInfosMap: { [name: string]: IConsumerInfo } = {};
  private responseQueue: string;
  private responseConsumerInfo: IConsumerInfo;
  private waitingRequests: { [corrId: string]: RequestExecutor } = {};
  private channelPool: AmqpChannelPoolService;
  private serviceName: string;
  private hooks: { [key: string]: RpcHook[] };
  private onGoingRpcRequestCount: number = 0;
  private purging: Function | null = null;

  constructor(serviceName?: string) {
    this.serviceName = serviceName || 'unknown';
    this.hooks = {};
  }

  public async initialize(channelPool: AmqpChannelPoolService, opts?: InitializeOptions): Promise<any> {
    if (opts && opts.noReviver) {
      RpcResponse.reviver = undefined;
    } else {
      RpcResponse.reviver = reviver;
    }
    // NOTE: live docker 환경에서는 같은 hostname + process.pid 조합이 유일하지 않을 수 있다
    // docker 내부의 process id 는 1인 경우가 대부분이며 host=net으로 실행시키는 경우 hostname도 동일할 수 있다.
    this.responseQueue = `rpc.res.${this.serviceName}.${os.hostname()}.${uuid.v4()}`;
    logger.info(`consuming ${this.responseQueue}`);
    const consumer = (msg: Message) => {
      if (!msg) {
        logger.error(`[WARN] msg is null. consume was canceled unexpectedly`);
      }
      const correlationId = msg.properties.correlationId || 'no-correlation-id';
      const waiting = this.waitingRequests[correlationId];
      if (!waiting) {
        // Request timeout이 생겨도 waiting이 없음
        logger.notice(`[RPC-WARNING] invalid correlationId ${correlationId}`);
        return Promise.resolve();
      }
      delete this.waitingRequests[correlationId];
      return waiting.resolve(msg);
    };

    await TraceLog.initialize();

    this.channelPool = channelPool;
    await channelPool.usingChannel(channel => channel.assertQueue(this.responseQueue, { exclusive: true }));
    this.responseConsumerInfo = await this._consume(this.responseQueue, consumer);
  }

  public _publish(exchange: any, routingKey: any, content: any, options?: any) {
    return this.channelPool.usingChannel(channel => {
      return Promise.resolve(channel.publish(exchange, routingKey, content, options));
    });
  }

  public async purge() {
    this.hooks = {};
    if (!this.consumerInfosMap) return Promise.resolve();
    return Promise.all(_.map(this.consumerInfosMap, async consumerInfo => {
      logger.info('stop serving', consumerInfo.key);
      await this.pause(consumerInfo.key);
      delete this.consumerInfosMap[consumerInfo.key];
    }))
      .then((): Promise<any> => {
        if (this.onGoingRpcRequestCount > 0) {
          return new Promise((res, rej) => { this.purging = res; });
        }
        return Promise.resolve();
    });
  }

  public registerHook(type: RpcHookType, hook: RpcHook) {
    this.hooks[type] = this.hooks[type] || [];
    this.hooks[type].push(hook);
  }

  // [TODO] Endpoint도 동일하게 RpcService.register를 부르는데, rpcOptions는 Endpoint가 아닌 RPC만 전달한다
  // 포함 관계가 잘못됐다. 애매하다. @kson //2016-08-09
  public async register(rpcName: string,
                        handler: (req: any) => Promise<any>,
                        type: 'endpoint' | 'rpc',
                        rpcOptions?: RpcOptions): Promise<void> {
    await this.channelPool.usingChannel(channel => channel.assertQueue(rpcName, {
      arguments : {'x-expires': RPC_QUEUE_EXPIRES_MS},
      durable   : false
    }));

    this.consumerInfosMap[rpcName] = await this._consume(rpcName, (msg: Message) => {
      const { replyTo, headers, correlationId } = msg.properties;
      if (!replyTo) throw ISLAND.FATAL.F0026_MISSING_REPLYTO_IN_RPC;

      const tattoo = headers && headers.tattoo;
      const timestamp = msg.properties.timestamp || 0;
      const log = createTraceLog({ tattoo, timestamp, msg, headers, rpcName, serviceName: this.serviceName });
      this.onGoingRpcRequestCount++;
      return this.enterCLS(tattoo, rpcName, async () => {
        const options = { correlationId, headers };
        const parsed = JSON.parse(msg.content.toString('utf8'), reviver);
        try {
          await Bluebird.resolve()
            .then(()  => sanitizeAndValidate(parsed, rpcOptions))
            .tap (req => logger.debug(`Got ${rpcName} with ${JSON.stringify(req)}`))
            .then(req => this.dohook('pre', type, req))
            .then(req => handler(req))
            .then(res => this.dohook('post', type, res))
            .then(res => sanitizeAndValidateResult(res, rpcOptions)) ///< [TODO] 얘를 훅으로 넣고 싶다.
            .then(res => this.reply(replyTo, res, options))
            .tap (()  => log.end())
            .tap (res => logger.debug(`responses ${JSON.stringify(res)}`))
            .timeout(RPC_EXEC_TIMEOUT_MS);
        } catch (err) {
          await Bluebird.resolve(err)
            .then(err => this.earlyThrowWith503(rpcName, err, msg))
            .tap (err => log.end(err))
            .then(err => this.dohook('pre-error', type, err))
            .then(err => this.reply(replyTo, err, options))
            .then(err => this.dohook('post-error', type, err))
            .tap (err => this.logRpcError(err, rpcName, parsed));
          throw err;
        } finally {
          log.shoot();
          if (--this.onGoingRpcRequestCount < 1 && this.purging) {
            this.purging();
          }
        }
      });
    });
  }

  public async pause(name: string) {
    const consumerInfo = this.consumerInfosMap[name];
    if (!consumerInfo) return;
    await consumerInfo.channel.cancel(consumerInfo.tag);
  }

  public async resume(name: string) {
    const consumerInfo = this.consumerInfosMap[name];
    if (!consumerInfo) return;
    await consumerInfo.channel.consume(consumerInfo.key, consumerInfo.consumer);
  }

  public async unregister(name: string) {
    const consumerInfo = this.consumerInfosMap[name];
    if (!consumerInfo) return;

    await this._cancel(consumerInfo);
    delete this.consumerInfosMap[name];
  }

  public throwTimeout(name, corrId: string) {
    delete this.waitingRequests[corrId];
    const err = new FatalError(ISLAND.FATAL.F0023_RPC_TIMEOUT,
                               `RPC(${name} does not return in ${RPC_WAIT_TIMEOUT_MS} ms`);
    err.statusCode = 504;
    throw err;
  }

  public async invoke<T, U>(name: string, msg: T, opts?: any): Promise<U>;
  public async invoke(name: string, msg: any, opts?: any): Promise<any> {
    const option = this.makeInvokeOption();
    const p = this.waitRequest(option.correlationId!, (msg: Message) => {
      const res = RpcResponse.decode(msg.content);
      if (res.result === false) throw res.body;
      if (opts && opts.withRawdata) return { body: res.body, raw: msg.content };
      return res.body;
    })
      .timeout(RPC_WAIT_TIMEOUT_MS)
      .catch(Bluebird.TimeoutError, () => this.throwTimeout(name, option.correlationId!))
      .catch(err => {
        err.tattoo = option.headers.tattoo;
        throw err;
      });

    const content = new Buffer(JSON.stringify(msg), 'utf8');
    try {
      await this.channelPool.usingChannel(async chan => chan.sendToQueue(name, content, option));
    } catch (e) {
      this.waitingRequests[option.correlationId!].reject(e);
      delete this.waitingRequests[option.correlationId!];
    }
    return await p;
  }

  // There are two kind of consumes - get requested / get a response
  // * get-requested consumers can be multiple per a node and they shares a RPC queue between island nodes
  // * get-a-response consumer is only one per a node and it has an exclusive queue
  protected async _consume(key: string, handler: (msg) => Promise<any>): Promise<IConsumerInfo> {
    const channel = await this.channelPool.acquireChannel();
    await channel.prefetch(+process.env.RPC_PREFETCH || 1000);

    const consumer = async msg => {
      try {
        await handler(msg);
        channel.ack(msg);
      } catch (error) {
        if (this.is503(error)) return nackWithDelay(channel, msg);
        channel.ack(msg);
      }
    };
    const result = await channel.consume(key, consumer);
    return { channel, tag: result.consumerTag, key, consumer };
  }

  protected async _cancel(consumerInfo: IConsumerInfo): Promise<void> {
      await consumerInfo.channel.cancel(consumerInfo.tag);
      await this.channelPool.releaseChannel(consumerInfo.channel);
  }

  private waitRequest(corrId: string, handleResponse: (msg: Message) => any) {
    const p = new Bluebird((resolve, reject) => {
      this.waitingRequests[corrId] = { resolve, reject };
    }).then((msg: Message) => {
      const scoped = cls.getNamespace('app').bind((msg: Message) => {
        delete this.waitingRequests[corrId];
        return handleResponse(msg);
      });
      return scoped(msg);
    });
    return p;
  }

  private makeInvokeOption(): amqp.Options.Publish {
    const ns = cls.getNamespace('app');
    const tattoo = ns.get('RequestTrackId');
    const context = ns.get('Context');
    const type = ns.get('Type');
    const correlationId = uuid.v4();
    const headers = {
      tattoo,
      from: { node: process.env.HOSTNAME, context, island: this.serviceName, type }
    };
    return {
      correlationId,
      expiration: RPC_WAIT_TIMEOUT_MS,
      headers,
      replyTo: this.responseQueue,
      timestamp: +(new Date())
    };
  }

  // 503(Service Temporarily Unavailable) 오류일 때는 응답을 caller에게 안보내줘야함
  private async earlyThrowWith503(rpcName, err, msg) {
    // Requeue the message when it has a chance
    if (this.is503(err)) throw err;
    return err;
  }

  private is503(err) {
    return err.statusCode && parseInt(err.statusCode, 10) === 503;
  }

  private logRpcError(err, rpcName, req) {
    err.extra = err.extra || { island: this.serviceName, rpcName, req };
    logger.error(`Got an error during ${err.extra.island}/${err.extra.name}` +
      ` with ${JSON.stringify(err.extra.req)} - ${err.stack}`);
  }

  // returns value again for convenience
  private async reply(replyTo: string, value: any, options: amqp.Options.Publish) {
    await this.channelPool.usingChannel(async channel => {
      return channel.sendToQueue(replyTo, RpcResponse.encode(value, this.serviceName), options);
    });
    return value;
  }

  // enter continuation-local-storage scope
  private enterCLS(tattoo, rpcName, func) {
    return enterScope({ RequestTrackId: tattoo, Context: rpcName, Type: 'rpc' }, func);
  }

  private async dohook(prefix: 'pre' | 'post' | 'pre-error' | 'post-error', type: 'endpoint' | 'rpc', value) {
    const hookType = {
      endpoint: {
        pre: RpcHookType.PRE_ENDPOINT, post: RpcHookType.POST_ENDPOINT,
        'pre-error': RpcHookType.PRE_ENDPOINT_ERROR, 'post-error': RpcHookType.POST_ENDPOINT_ERROR
      },
      rpc: {
        pre: RpcHookType.PRE_RPC, post: RpcHookType.POST_RPC,
        'pre-error': RpcHookType.PRE_RPC_ERROR, 'post-error': RpcHookType.POST_RPC_ERROR
      }
    }[type][prefix];
    const hook = this.hooks[hookType];
    if (!hook) return value;
    return Bluebird.reduce(this.hooks[hookType], (value, hook) => hook(value), value);
  }
}
