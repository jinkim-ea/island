import MessageBrokerService from '../../services/message-broker-service';
import RabbitMqAdapter from './rabbitmq-adapter';
export default class MessageBrokerAdapter extends RabbitMqAdapter<MessageBrokerService> {
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
    listen(): Promise<void>;
    destroy(): Promise<void>;
}
