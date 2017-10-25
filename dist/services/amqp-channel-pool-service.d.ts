/// <reference types="bluebird" />
import * as amqp from 'amqplib';
import * as Bluebird from 'bluebird';
export interface AmqpOptions {
    url: string;
    socketOptions?: {
        noDelay?: boolean;
        heartbeat?: number;
    };
    poolSize?: number;
    name?: string;
    prefetchCount?: number;
}
export interface ChannelInfo {
    channel: amqp.Channel;
    date: number;
}
export declare class AmqpChannelPoolService {
    static DEFAULT_POOL_SIZE: number;
    private connection;
    private options;
    private openChannels;
    private idleChannels;
    private initResolver;
    constructor();
    initialize(options: AmqpOptions): Promise<void>;
    getPrefetchCount(): (number | undefined);
    waitForInit(): Promise<void>;
    purge(): Promise<void>;
    acquireChannel(): Promise<amqp.Channel>;
    releaseChannel(channel: amqp.Channel, reusable?: boolean): Promise<void>;
    usingChannel<T>(task: (channel: amqp.Channel) => PromiseLike<T>): Promise<T>;
    getChannelDisposer(): Bluebird.Disposer<amqp.Channel>;
    private createChannel();
    private setChannelEventHandler(channel);
}
