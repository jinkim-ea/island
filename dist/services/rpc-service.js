"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cls = require("continuation-local-storage");
const Bluebird = require("bluebird");
const deprecated_decorator_1 = require("deprecated-decorator");
const _ = require("lodash");
const os = require("os");
const uuid = require("uuid");
const schema_middleware_1 = require("../middleware/schema.middleware");
const error_1 = require("../utils/error");
const logger_1 = require("../utils/logger");
const reviver_1 = require("../utils/reviver");
const rpc_response_1 = require("../utils/rpc-response");
exports.RpcResponse = rpc_response_1.RpcResponse;
const status_exporter_1 = require("../utils/status-exporter");
const tracelog_1 = require("../utils/tracelog");
const RPC_EXEC_TIMEOUT_MS = parseInt(process.env.ISLAND_RPC_EXEC_TIMEOUT_MS, 10) || 25000;
const RPC_WAIT_TIMEOUT_MS = parseInt(process.env.ISLAND_RPC_WAIT_TIMEOUT_MS, 10) || 60000;
const SERVICE_LOAD_TIME_MS = parseInt(process.env.ISLAND_SERVICE_LOAD_TIME_MS, 10) || 60000;
const RPC_QUEUE_EXPIRES_MS = RPC_WAIT_TIMEOUT_MS + SERVICE_LOAD_TIME_MS;
var RpcHookType;
(function (RpcHookType) {
    RpcHookType[RpcHookType["PRE_ENDPOINT"] = 0] = "PRE_ENDPOINT";
    RpcHookType[RpcHookType["POST_ENDPOINT"] = 1] = "POST_ENDPOINT";
    RpcHookType[RpcHookType["PRE_RPC"] = 2] = "PRE_RPC";
    RpcHookType[RpcHookType["POST_RPC"] = 3] = "POST_RPC";
    RpcHookType[RpcHookType["PRE_ENDPOINT_ERROR"] = 4] = "PRE_ENDPOINT_ERROR";
    RpcHookType[RpcHookType["POST_ENDPOINT_ERROR"] = 5] = "POST_ENDPOINT_ERROR";
    RpcHookType[RpcHookType["PRE_RPC_ERROR"] = 6] = "PRE_RPC_ERROR";
    RpcHookType[RpcHookType["POST_RPC_ERROR"] = 7] = "POST_RPC_ERROR";
})(RpcHookType = exports.RpcHookType || (exports.RpcHookType = {}));
function createTraceLog({ tattoo, timestamp, msg, headers, rpcName, serviceName }) {
    const log = new tracelog_1.TraceLog(tattoo, timestamp);
    log.size = msg.content.byteLength;
    log.from = headers.from;
    log.to = { node: process.env.HOSTNAME, context: rpcName, island: serviceName, type: 'rpc' };
    return log;
}
function sanitizeAndValidate(content, rpcOptions) {
    if (rpcOptions) {
        if (_.get(rpcOptions, 'schema.query.sanitization')) {
            content = schema_middleware_1.sanitize(rpcOptions.schema.query.sanitization, content);
        }
        if (_.get(rpcOptions, 'schema.query.validation')) {
            if (!schema_middleware_1.validate(rpcOptions.schema.query.validation, content)) {
                throw new error_1.LogicError(error_1.ISLAND.LOGIC.L0002_WRONG_PARAMETER_SCHEMA, `Wrong parameter schema`);
            }
        }
    }
    return content;
}
function sanitizeAndValidateResult(res, rpcOptions) {
    if (!rpcOptions)
        return res;
    if (_.get(rpcOptions, 'schema.result.sanitization')) {
        res = schema_middleware_1.sanitize(rpcOptions.schema.result.sanitization, res);
    }
    if (_.get(rpcOptions, 'schema.result.validation')) {
        schema_middleware_1.validate(rpcOptions.schema.result.validation, res);
    }
    return res;
}
function nackWithDelay(channel, msg) {
    setTimeout(() => channel.nack(msg), 1000);
}
const NO_REVIVER = process.env.NO_REVIVER === 'true';
class RPCService {
    constructor(serviceName) {
        this.consumerInfosMap = {};
        this.waitingResponse = {};
        this.timedOut = {};
        this.timedOutOrdered = [];
        this.onGoingRpcRequestCount = 0;
        this.purging = null;
        this.rpcEntities = {};
        this.serviceName = serviceName || 'unknown';
        this.hooks = {};
    }
    initialize(channelPool, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (NO_REVIVER || opts && opts.noReviver) {
                rpc_response_1.RpcResponse.reviver = undefined;
            }
            else {
                rpc_response_1.RpcResponse.reviver = reviver_1.default;
            }
            this.responseQueueName = this.makeResponseQueueName();
            logger_1.logger.info(`consuming ${this.responseQueueName}`);
            yield tracelog_1.TraceLog.initialize();
            this.channelPool = channelPool;
            yield channelPool.usingChannel(channel => channel.assertQueue(this.responseQueueName, { exclusive: true }));
            this.responseConsumerInfo = yield this.consumeForResponse();
        });
    }
    _publish(exchange, routingKey, content, options) {
        return this.channelPool.usingChannel(channel => {
            return Promise.resolve(channel.publish(exchange, routingKey, content, options));
        });
    }
    purge() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(_.map(this.consumerInfosMap, (consumerInfo) => __awaiter(this, void 0, void 0, function* () {
                logger_1.logger.info('stop serving', consumerInfo.key);
                yield this.pause(consumerInfo.key);
                delete this.consumerInfosMap[consumerInfo.key];
                delete this.rpcEntities[consumerInfo.key];
            })))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                if (this.onGoingRpcRequestCount > 0) {
                    return new Promise((res, rej) => { this.purging = res; });
                }
            }))
                .then(() => {
                this.hooks = {};
                this.timedOut = {};
                this.timedOutOrdered = [];
            });
        });
    }
    registerHook(type, hook) {
        this.hooks[type] = this.hooks[type] || [];
        this.hooks[type].push(hook);
    }
    register(rpcName, handler, type, rpcOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            this.rpcEntities[rpcName] = { handler, type, rpcOptions };
            yield this.channelPool.usingChannel(channel => channel.assertQueue(rpcName, {
                arguments: { 'x-expires': RPC_QUEUE_EXPIRES_MS },
                durable: false
            }));
        });
    }
    listen() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(_.map(this.rpcEntities, ({ type, handler, rpcOptions }, rpcName) => __awaiter(this, void 0, void 0, function* () {
                this.consumerInfosMap[rpcName] = yield this._consume(rpcName, (msg) => {
                    const { replyTo, headers, correlationId } = msg.properties;
                    if (!replyTo)
                        throw error_1.ISLAND.FATAL.F0026_MISSING_REPLYTO_IN_RPC;
                    const startExecutedAt = +new Date();
                    const tattoo = headers && headers.tattoo;
                    const extra = headers && headers.extra || {};
                    const timestamp = msg.properties.timestamp || 0;
                    const log = createTraceLog({ tattoo, timestamp, msg, headers, rpcName, serviceName: this.serviceName });
                    status_exporter_1.exporter.collectRequestAndReceivedTime(type, +new Date() - timestamp);
                    return this.enterCLS(tattoo, rpcName, extra, () => __awaiter(this, void 0, void 0, function* () {
                        const options = { correlationId, headers };
                        const parsed = JSON.parse(msg.content.toString('utf8'), rpc_response_1.RpcResponse.reviver);
                        try {
                            this.onGoingRpcRequestCount++;
                            yield Bluebird.resolve()
                                .then(() => sanitizeAndValidate(parsed, rpcOptions))
                                .tap(req => logger_1.logger.debug(`Got ${rpcName} with ${JSON.stringify(req)}`))
                                .then(req => this.dohook('pre', type, req))
                                .then(req => handler(req))
                                .then(res => this.dohook('post', type, res))
                                .then(res => sanitizeAndValidateResult(res, rpcOptions))
                                .then(res => this.reply(replyTo, res, options))
                                .tap(() => log.end())
                                .tap(() => status_exporter_1.exporter.collectExecutedCountAndExecutedTime(type, +new Date() - startExecutedAt))
                                .tap(res => logger_1.logger.debug(`responses ${JSON.stringify(res)} ${type}, ${rpcName}`))
                                .timeout(RPC_EXEC_TIMEOUT_MS);
                        }
                        catch (err) {
                            yield Bluebird.resolve(err)
                                .then(err => this.earlyThrowWith503(rpcName, err, msg))
                                .tap(err => log.end(err))
                                .then(err => this.dohook('pre-error', type, err))
                                .then(err => this.attachExtraError(err, rpcName, parsed))
                                .then(err => this.reply(replyTo, err, options))
                                .then(err => this.dohook('post-error', type, err))
                                .tap(err => this.logRpcError(err));
                            throw err;
                        }
                        finally {
                            log.shoot();
                            if (--this.onGoingRpcRequestCount < 1 && this.purging) {
                                this.purging();
                            }
                        }
                    }));
                });
            })));
        });
    }
    pause(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const consumerInfo = this.consumerInfosMap[name];
            if (!consumerInfo)
                return;
            yield consumerInfo.channel.cancel(consumerInfo.tag);
        });
    }
    resume(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const consumerInfo = this.consumerInfosMap[name];
            if (!consumerInfo)
                return;
            yield consumerInfo.channel.consume(consumerInfo.key, consumerInfo.consumer);
        });
    }
    unregister(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const consumerInfo = this.consumerInfosMap[name];
            if (!consumerInfo)
                return;
            yield this._cancel(consumerInfo);
            delete this.consumerInfosMap[name];
            delete this.rpcEntities[name];
        });
    }
    invoke(name, msg, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const option = this.makeInvokeOption();
            const p = this.waitResponse(option.correlationId, (msg) => {
                const res = rpc_response_1.RpcResponse.decode(msg.content);
                if (res.result === false)
                    throw res.body;
                if (opts && opts.withRawdata)
                    return { body: res.body, raw: msg.content };
                return res.body;
            })
                .timeout(RPC_WAIT_TIMEOUT_MS)
                .catch(Bluebird.TimeoutError, () => this.throwTimeout(name, option.correlationId))
                .catch(err => {
                err.tattoo = option.headers.tattoo;
                throw err;
            });
            const content = new Buffer(JSON.stringify(msg), 'utf8');
            try {
                yield this.channelPool.usingChannel((chan) => __awaiter(this, void 0, void 0, function* () { return chan.sendToQueue(name, content, option); }));
            }
            catch (e) {
                this.waitingResponse[option.correlationId].reject(e);
                delete this.waitingResponse[option.correlationId];
            }
            return yield p;
        });
    }
    // There are two kind of consumes - get requested / get a response
    // * get-requested consumers can be multiple per a node and they shares a RPC queue between island nodes
    // * get-a-response consumer is only one per a node and it has an exclusive queue
    _consume(key, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = yield this.channelPool.acquireChannel();
            const prefetchCount = yield this.channelPool.getPrefetchCount();
            yield channel.prefetch(prefetchCount || +process.env.RPC_PREFETCH || 100);
            const consumer = (msg) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield handler(msg);
                    channel.ack(msg);
                }
                catch (error) {
                    if (this.is503(error))
                        return nackWithDelay(channel, msg);
                    if (this.isCritical(error))
                        return this.shutdown();
                    channel.ack(msg);
                }
            });
            const result = yield channel.consume(key, consumer);
            return { channel, tag: result.consumerTag, key, consumer };
        });
    }
    _cancel(consumerInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield consumerInfo.channel.cancel(consumerInfo.tag);
            yield this.channelPool.releaseChannel(consumerInfo.channel);
        });
    }
    throwTimeout(name, corrId) {
        delete this.waitingResponse[corrId];
        this.timedOut[corrId] = name;
        this.timedOutOrdered.push(corrId);
        if (20 < this.timedOutOrdered.length) {
            delete this.timedOut[this.timedOutOrdered.shift()];
        }
        const err = new error_1.FatalError(error_1.ISLAND.FATAL.F0023_RPC_TIMEOUT, `RPC(${name}) does not return in ${RPC_WAIT_TIMEOUT_MS} ms`);
        err.statusCode = 504;
        throw err;
    }
    shutdown() {
        process.emit('SIGTERM');
    }
    makeResponseQueueName() {
        // NOTE: live docker 환경에서는 같은 hostname + process.pid 조합이 유일하지 않을 수 있다
        // docker 내부의 process id 는 1인 경우가 대부분이며 host=net으로 실행시키는 경우 hostname도 동일할 수 있다.
        return `rpc.res.${this.serviceName}.${os.hostname()}.${uuid.v4()}`;
    }
    consumeForResponse() {
        return this._consume(this.responseQueueName, (msg) => {
            if (!msg) {
                logger_1.logger.crit(`The consumer is canceled, will lose following responses - https://goo.gl/HIgy4D`);
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0027_CONSUMER_IS_CANCELED);
            }
            const correlationId = msg.properties.correlationId;
            if (!correlationId) {
                logger_1.logger.notice('Got a response with no correlationId');
                return;
            }
            if (this.timedOut[correlationId]) {
                const name = this.timedOut[correlationId];
                delete this.timedOut[correlationId];
                _.pull(this.timedOutOrdered, correlationId);
                logger_1.logger.warning(`Got a response of \`${name}\` after timed out - ${correlationId}`);
                return;
            }
            const waiting = this.waitingResponse[correlationId];
            if (!waiting) {
                logger_1.logger.notice(`Got an unknown response - ${correlationId}`);
                return;
            }
            delete this.waitingResponse[correlationId];
            return waiting.resolve(msg);
        });
    }
    waitResponse(corrId, handleResponse) {
        return new Bluebird((resolve, reject) => {
            this.waitingResponse[corrId] = { resolve, reject };
        }).then((msg) => {
            const clsScoped = cls.getNamespace('app').bind((msg) => {
                delete this.waitingResponse[corrId];
                return handleResponse(msg);
            });
            return clsScoped(msg);
        });
    }
    makeInvokeOption() {
        const ns = cls.getNamespace('app');
        const tattoo = ns.get('RequestTrackId');
        const context = ns.get('Context');
        const type = ns.get('Type');
        const sessionType = ns.get('sessionType');
        const correlationId = uuid.v4();
        const headers = {
            tattoo,
            from: { node: process.env.HOSTNAME, context, island: this.serviceName, type },
            extra: {
                sessionType
            }
        };
        return {
            correlationId,
            expiration: RPC_WAIT_TIMEOUT_MS,
            headers,
            replyTo: this.responseQueueName,
            timestamp: +(new Date())
        };
    }
    // 503(Service Temporarily Unavailable) 오류일 때는 응답을 caller에게 안보내줘야함
    earlyThrowWith503(rpcName, err, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            // Requeue the message when it has a chance
            if (this.is503(err))
                throw err;
            return err;
        });
    }
    is503(err) {
        return err.statusCode && parseInt(err.statusCode, 10) === 503;
    }
    isCritical(err) {
        return err.code === error_1.mergeIslandJsError(error_1.ISLAND.FATAL.F0027_CONSUMER_IS_CANCELED);
    }
    logRpcError(err) {
        logger_1.logger.error(`Got an error during ${err.extra.island}/${err.extra.rpcName}` +
            ` with ${JSON.stringify(err.extra.req)} - ${err.stack}`);
    }
    attachExtraError(err, rpcName, req) {
        err.extra = _.defaults({}, err.extra, { island: this.serviceName, rpcName, req });
        err.extra = error_1.AbstractError.ensureUuid(err.extra);
        return err;
    }
    // returns value again for convenience
    reply(replyTo, value, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.channelPool.usingChannel((channel) => __awaiter(this, void 0, void 0, function* () {
                return channel.sendToQueue(replyTo, rpc_response_1.RpcResponse.encode(value), options);
            }));
            return value;
        });
    }
    // enter continuation-local-storage scope
    enterCLS(tattoo, rpcName, extra, func) {
        const properties = _.merge({ RequestTrackId: tattoo, Context: rpcName, Type: 'rpc' }, extra);
        return new Promise((resolve, reject) => {
            const ns = cls.getNamespace('app');
            ns.run(() => {
                _.each(properties, (value, key) => {
                    ns.set(key, value);
                });
                Bluebird.try(func).then(resolve).catch(reject);
            });
        });
    }
    dohook(prefix, type, value) {
        return __awaiter(this, void 0, void 0, function* () {
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
            if (!hook)
                return value;
            return Bluebird.reduce(this.hooks[hookType], (value, hook) => hook(value), value);
        });
    }
}
__decorate([
    deprecated_decorator_1.default(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], RPCService.prototype, "_publish", null);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RPCService;
//# sourceMappingURL=rpc-service.js.map