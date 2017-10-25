/// <reference types="node" />
import * as amqp from 'amqplib';
export interface Event<T> {
    key: string;
    args: T;
    publishedAt?: Date;
}
export declare class BaseEvent<T> implements Event<T> {
    key: string;
    args: T;
    publishedAt: Date;
    constructor(key: string, args: T);
}
export declare class DebugBaseEvent<T> implements Event<T> {
    key: string;
    args: T;
    publishedAt: Date;
    constructor(key: string, args: T, publishedAt?: Date);
}
export declare class DebugEvent<T> extends DebugBaseEvent<T> {
    debugClass: {
        key: string;
        args: T;
    };
    publishedAt: Date;
    constructor(debugClass: {
        key: string;
        args: T;
    }, publishedAt?: Date);
}
export interface EventHandler<T> {
    (event: T): Promise<any> | any;
}
export interface Message {
    content: Buffer;
    fields: {
        routingKey: string;
    };
    properties: amqp.Options.Publish;
}
export declare abstract class Subscriber {
    abstract getQueue(): string;
    abstract setQueue(queue: string): void;
    abstract getRoutingPattern(): string;
    abstract isRoutingKeyMatched(routingKey: string): boolean;
    abstract handleEvent(content: any, msg: Message): Promise<any>;
}
export declare class EventSubscriber extends Subscriber {
    private handler;
    private eventClass;
    private key;
    private queue;
    constructor(handler: EventHandler<Event<any>>, eventClass: new (args: any) => Event<any>);
    getQueue(): string;
    setQueue(queue: string): void;
    getRoutingPattern(): string;
    readonly routingKey: string;
    isRoutingKeyMatched(routingKey: string): boolean;
    handleEvent(content: any, msg: Message): Promise<any>;
}
export declare class PatternSubscriber extends Subscriber {
    private handler;
    private pattern;
    private regExp;
    private queue;
    constructor(handler: EventHandler<Event<any>>, pattern: string);
    getQueue(): string;
    setQueue(queue: string): void;
    getRoutingPattern(): string;
    isRoutingKeyMatched(routingKey: string): boolean;
    handleEvent(content: any, msg: Message): Promise<any>;
    private convertRoutingKeyPatternToRegexp(pattern);
}
