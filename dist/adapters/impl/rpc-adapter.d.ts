import RPCService, { RpcHook, RpcHookType } from '../../services/rpc-service';
import ListenableAdapter from '../listenable-adapter';
import { AmqpChannelPoolAdapter } from './amqp-channel-pool-adapter';
export interface RPCAdapterOptions {
    amqpChannelPoolAdapter: AmqpChannelPoolAdapter;
    serviceName: string;
    noReviver?: boolean;
}
export default class RPCAdapter extends ListenableAdapter<RPCService, RPCAdapterOptions> {
    hooks: {
        type: RpcHookType;
        hook: RpcHook;
    }[];
    constructor(options: any);
    initialize(): Promise<void>;
    listen(): Promise<void>;
    destroy(): Promise<any>;
    registerHook(type: RpcHookType, hook: RpcHook): void;
}
