import { SubscriptionOptions } from '../services/event-service';
import { Event } from '../services/event-subscriber';
import AbstractController from './abstract-controller';
export declare function eventController(target: typeof AbstractController): void;
export declare function subscribeEvent<T extends Event<U>, U>(eventClass: new (args: U) => T, options?: SubscriptionOptions): (target: any, propertyKey: string, desc: PropertyDescriptor) => void;
export declare function subscribePattern(pattern: string, options?: SubscriptionOptions): (target: any, propertyKey: string, desc: PropertyDescriptor) => void;
