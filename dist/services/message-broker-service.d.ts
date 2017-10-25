import * as amqp from 'amqplib';
import AbstractBrokerService from './abstract-broker-service';
export default class MessageBrokerService extends AbstractBrokerService {
    private static EXCHANGE_NAME;
    private roundRobinEventQ;
    private fanoutEventQ;
    private consumerInfos;
    private handlers;
    constructor(connection: amqp.Connection, serviceName: string);
    initialize(): Promise<void>;
    startConsume(): Promise<void>;
    purge(): Promise<void>;
    subscribe(pattern: string, handler?: Handler): Promise<void>;
    unsubscribe(pattern: string): Promise<void>;
    subscribeFanout(pattern: string, handler?: Handler): Promise<void>;
    unsubscribeFanout(pattern: string): Promise<void>;
    publish<T>(key: string, msg: T): Promise<void>;
    private checkInitialized();
    private onMessage(msg, routingKey);
    private matcher(pattern);
    private consumeQueues(handler, options?);
    private cancelConsumes(consumeInfos);
}
export interface Handler {
    (msg: any, routingKey: string): void;
}
