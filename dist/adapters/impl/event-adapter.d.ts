import { EventService } from '../../services/event-service';
import ListenableAdapter from '../listenable-adapter';
import { AmqpChannelPoolAdapter } from './amqp-channel-pool-adapter';
export interface EventAdapterOptions {
    amqpChannelPoolAdapter: AmqpChannelPoolAdapter;
    serviceName: string;
}
export declare class EventAdapter extends ListenableAdapter<EventService, EventAdapterOptions> {
    initialize(): Promise<void>;
    listen(): Promise<void>;
    destroy(): Promise<any>;
}
