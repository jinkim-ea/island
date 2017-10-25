import PushService from '../../services/push-service';
import ListenableAdapter from '../listenable-adapter';
import { AmqpChannelPoolAdapter } from './amqp-channel-pool-adapter';
export interface PushAdapterOptions {
    amqpChannelPoolAdapter: AmqpChannelPoolAdapter;
}
export default class PushAdapter extends ListenableAdapter<PushService, PushAdapterOptions> {
    initialize(): Promise<void>;
    listen(): Promise<void>;
    destroy(): Promise<any>;
}
