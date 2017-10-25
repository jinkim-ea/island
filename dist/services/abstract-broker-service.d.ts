import * as amqp from 'amqplib';
import MessagePack from '../utils/msgpack';
export interface IConsumerInfo {
    channel: amqp.Channel;
    tag: string;
}
export default class AbstractBrokerService {
    protected connection: amqp.Connection;
    protected options: {
        rpcTimeout?: number;
        serviceName?: string;
    };
    protected msgpack: MessagePack;
    protected initialized: boolean;
    constructor(connection: amqp.Connection, options?: {
        rpcTimeout?: number;
        serviceName?: string;
    });
    initialize(): Promise<never>;
    protected declareExchange(name: string, type: string, options: amqp.Options.AssertExchange): Promise<amqp.Replies.AssertExchange>;
    protected deleteExchage(name: string, options?: amqp.Options.DeleteExchange): Promise<amqp.Replies.Empty>;
    protected declareQueue(name: string, options: amqp.Options.AssertQueue): Promise<amqp.Replies.AssertQueue>;
    protected deleteQueue(name: string, options?: amqp.Options.DeleteQueue): Promise<amqp.Replies.DeleteQueue>;
    protected bindQueue(queue: string, source: string, pattern?: string, args?: any): Promise<amqp.Replies.Empty>;
    protected unbindQueue(queue: string, source: string, pattern?: string, args?: any): Promise<amqp.Replies.Empty>;
    protected sendToQueue(queue: string, content: any, options?: any): Promise<boolean>;
    protected ack(message: any, allUpTo?: any): Promise<any>;
    protected _consume(key: string, handler: (msg) => Promise<any>, tag: string, options?: any): Promise<IConsumerInfo>;
    protected _cancel(consumerInfo: IConsumerInfo): Promise<amqp.Replies.Empty>;
    protected _publish(exchange: any, routingKey: any, content: any, options?: any): Promise<any>;
    private getChannel();
    private call(handler, ignoreClosingChannel?);
}
