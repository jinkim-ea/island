import { AmqpChannelPoolService } from './amqp-channel-pool-service';
import { Event, EventHandler } from './event-subscriber';
export declare type EventHook = (obj) => Promise<any>;
export declare enum EventHookType {
    EVENT = 0,
    ERROR = 1,
}
export declare class EventService {
    private static EXCHANGE_NAME;
    private channelPool;
    private roundRobinQ;
    private fanoutQ;
    private subscribers;
    private serviceName;
    private hooks;
    private onGoingEventRequestCount;
    private purging;
    constructor(serviceName: string);
    initialize(channelPool: AmqpChannelPoolService): Promise<any>;
    startConsume(): Promise<any>;
    purge(): Promise<any>;
    subscribeEvent<T extends Event<U>, U>(eventClass: new (args: U) => T, handler: EventHandler<T>, options?: SubscriptionOptions): Promise<void>;
    subscribePattern(pattern: string, handler: EventHandler<Event<any>>, options?: SubscriptionOptions): Promise<void>;
    publishEvent<T extends Event<U>, U>(exchange: string, event: T): Promise<any>;
    publishEvent<T extends Event<U>, U>(event: T): Promise<any>;
    registerHook(type: EventHookType, hook: EventHook): void;
    private registerConsumer(channel, queue);
    private sendErrorLog(err, msg);
    private dohook(type, value);
    private handleMessage(msg);
    private subscribe(subscriber, options?);
    private _publish(exchange, routingKey, content, options);
    private unsubscribe(subscriber);
}
export interface SubscriptionOptions {
    everyNodeListen?: boolean;
}
