import { AmqpChannelPoolService, AmqpOptions } from '../../services/amqp-channel-pool-service';
import AbstractAdapter from '../abstract-adapter';
export declare class AmqpChannelPoolAdapter extends AbstractAdapter<AmqpChannelPoolService, AmqpOptions> {
    initialize(): Promise<void>;
    destroy(): Promise<void>;
}
