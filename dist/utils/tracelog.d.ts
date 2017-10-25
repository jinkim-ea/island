import { AmqpChannelPoolService } from '../services/amqp-channel-pool-service';
export interface LogSource {
    node: string;
    context: string;
    island: string;
    type: 'rpc' | 'event' | 'endpoint';
}
export declare class TraceLog {
    static channelPool: AmqpChannelPoolService;
    static initialize(): Promise<any>;
    static purge(): Promise<any>;
    data: {
        tattoo?: string;
        ts: {
            c?: number;
            r?: number;
            e?: number;
        };
        size?: number;
        error?: boolean;
        from?: LogSource;
        to?: LogSource;
    };
    constructor(tattoo: string, created: number);
    size: number;
    from: LogSource;
    to: LogSource;
    end(error?: Error): void;
    shoot(): Promise<any>;
}
