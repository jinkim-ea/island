/// <reference types="node" />
import MessagePack from '../utils/msgpack';
import { AmqpChannelPoolService } from './amqp-channel-pool-service';
export declare type BroadcastTarget = 'all' | 'pc' | 'mobile';
export declare const BroadcastTargets: string[];
export default class PushService {
    static broadcastExchange: {
        name: {
            all: string;
            pc: string;
            mobile: string;
        };
        options: {
            durable: boolean;
        };
        type: string;
    };
    static playerPushExchange: {
        name: string;
        options: {
            durable: boolean;
        };
        type: string;
    };
    static msgpack: MessagePack;
    static encode(obj: any): Buffer;
    static decode(buf: any): any;
    private static DEFAULT_EXCHANGE_OPTIONS;
    private static autoDeleteTriggerQueue;
    private channelPool;
    constructor();
    initialize(channelPool: AmqpChannelPoolService): Promise<any>;
    purge(): Promise<any>;
    deleteExchange(exchange: string, options?: any): Promise<any>;
    /**
     * bind specific exchange wrapper
     * @param destination
     * @param source
     * @param pattern
     * @param sourceType
     * @param sourceOpts
     * @returns {Promise<any>}
     */
    bindExchange(destination: string, source: string, pattern?: string, sourceType?: string, sourceOpts?: any): Promise<any>;
    /**
     * unbind exchange wrapper
     * @param destination
     * @param source
     * @param pattern
     * @returns {Promise<any>}
     */
    unbindExchange(destination: string, source: string, pattern?: string): Promise<any>;
    /**
     * publish message to a player
     * @param pid
     * @param msg
     * @param options
     * @returns {Promise<any>}
     */
    unicast(pid: string, msg: any, options?: any): Promise<any>;
    /**
     * publish message to specific exchange
     * @param exchange
     * @param msg
     * @param routingKey
     * @param options
     * @returns {Promise<any>}
     */
    multicast(exchange: string, msg: any, routingKey?: string, options?: any): Promise<any>;
    /**
     * publish message to global fanout exchange
     * @param msg message to broadcast. message should be MessagePack encodable.
     * @param options publish options
     * @returns {Promise<any>}
     */
    broadcast(msg: any, options?: any): Promise<any>;
}
