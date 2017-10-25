import * as amqp from 'amqplib';
import { RpcOptions } from '../controllers/rpc-decorator';
import { RpcRequest } from '../utils/rpc-request';
import { IRpcResponse, RpcResponse } from '../utils/rpc-response';
import { AmqpChannelPoolService } from './amqp-channel-pool-service';
export { IRpcResponse, RpcRequest, RpcResponse };
export declare type RpcType = 'rpc' | 'endpoint';
export interface IConsumerInfo {
    channel: amqp.Channel;
    tag: string;
    options?: RpcOptions;
    key: string;
    consumer: (msg: any) => Promise<void>;
    consumerOpts?: any;
}
export declare type RpcHook = (rpc) => Promise<any>;
export declare enum RpcHookType {
    PRE_ENDPOINT = 0,
    POST_ENDPOINT = 1,
    PRE_RPC = 2,
    POST_RPC = 3,
    PRE_ENDPOINT_ERROR = 4,
    POST_ENDPOINT_ERROR = 5,
    PRE_RPC_ERROR = 6,
    POST_RPC_ERROR = 7,
}
export interface InitializeOptions {
    noReviver?: boolean;
}
export default class RPCService {
    private consumerInfosMap;
    private responseQueueName;
    private responseConsumerInfo;
    private waitingResponse;
    private timedOut;
    private timedOutOrdered;
    private channelPool;
    private serviceName;
    private hooks;
    private onGoingRpcRequestCount;
    private purging;
    private rpcEntities;
    constructor(serviceName?: string);
    initialize(channelPool: AmqpChannelPoolService, opts?: InitializeOptions): Promise<any>;
    _publish(exchange: any, routingKey: any, content: any, options?: any): Promise<boolean>;
    purge(): Promise<void>;
    registerHook(type: RpcHookType, hook: RpcHook): void;
    register(rpcName: string, handler: (req: any) => Promise<any>, type: RpcType, rpcOptions?: RpcOptions): Promise<void>;
    listen(): Promise<void>;
    pause(name: string): Promise<void>;
    resume(name: string): Promise<void>;
    unregister(name: string): Promise<void>;
    invoke<T, U>(name: string, msg: T, opts?: {
        withRawdata: boolean;
    }): Promise<U>;
    protected _consume(key: string, handler: (msg) => Promise<any>): Promise<IConsumerInfo>;
    protected _cancel(consumerInfo: IConsumerInfo): Promise<void>;
    private throwTimeout(name, corrId);
    private shutdown();
    private makeResponseQueueName();
    private consumeForResponse();
    private waitResponse(corrId, handleResponse);
    private makeInvokeOption();
    private earlyThrowWith503(rpcName, err, msg);
    private is503(err);
    private isCritical(err);
    private logRpcError(err);
    private attachExtraError(err, rpcName, req);
    private reply(replyTo, value, options);
    private enterCLS(tattoo, rpcName, extra, func);
    private dohook(prefix, type, value);
}
