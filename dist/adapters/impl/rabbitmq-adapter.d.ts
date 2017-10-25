import * as amqp from 'amqplib';
import ListenableAdapter from '../listenable-adapter';
export interface RabbitMqAdapterOptions {
    url: string;
    serviceName?: string;
    socketOptions?: {
        heartbeat?: number;
        noDelay: boolean;
    };
    rpcTimeout?: number;
}
export default class RabbitMqAdapter<T> extends ListenableAdapter<T, RabbitMqAdapterOptions> {
    protected connection: amqp.Connection;
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
    listen(): Promise<void>;
}
