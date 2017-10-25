import { SubscriptionOptions } from '../services/event-service';
import { BaseEvent, Event, EventHandler } from '../services/event-subscriber';
export interface EventSubscription<T extends Event<U>, U> {
    eventClass: new (args: U) => T;
    handler: EventHandler<T>;
    options?: SubscriptionOptions;
}
export declare namespace Events {
    namespace Arguments {
        interface LoggerTypeChanged {
            type: 'short' | 'long' | 'json';
        }
        interface LoggerLevelChanged {
            category: string;
            level: 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'crit';
        }
        interface SystemNodeStarted {
            name: string;
            island: string;
        }
    }
    class LoggerLevelChanged extends BaseEvent<Arguments.LoggerLevelChanged> {
        constructor(args: Arguments.LoggerLevelChanged);
    }
    class LoggerTypeChanged extends BaseEvent<Arguments.LoggerTypeChanged> {
        constructor(args: Arguments.LoggerTypeChanged);
    }
    class SystemNodeStarted extends BaseEvent<Arguments.SystemNodeStarted> {
        constructor(args: Arguments.SystemNodeStarted);
    }
}
export declare const DEFAULT_SUBSCRIPTIONS: EventSubscription<Event<any>, any>[];
