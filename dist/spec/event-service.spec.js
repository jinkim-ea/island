"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const amqp_channel_pool_service_1 = require("../services/amqp-channel-pool-service");
const event_service_1 = require("../services/event-service");
const event_subscriber_1 = require("../services/event-subscriber");
const jasmine_async_support_1 = require("../utils/jasmine-async-support");
const tracelog_1 = require("../utils/tracelog");
const Bluebird = require("bluebird");
class TestEvent extends event_subscriber_1.BaseEvent {
    constructor(args) {
        super('test.event', args);
    }
}
class TestPatternEvent extends event_subscriber_1.BaseEvent {
    constructor(args) {
        super('test.pattern', args);
    }
}
describe('EventService', () => {
    const amqpChannelPool = new amqp_channel_pool_service_1.AmqpChannelPoolService();
    const eventService = new event_service_1.EventService(`event-service-spec`);
    beforeAll(done => {
        amqpChannelPool.initialize({
            url: process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672'
        })
            .then(() => eventService.initialize(amqpChannelPool))
            .then(() => eventService.startConsume())
            .then(done)
            .catch(done.fail);
    });
    it('can publish an event', done => {
        eventService.publishEvent(new TestEvent('aaa'))
            .then(done)
            .catch(done.fail);
    });
    it('can subscribe the event', done => {
        eventService.subscribeEvent(TestEvent, (event) => {
            expect(event.args).toBe('bbb');
            setTimeout(done, 500);
        })
            .then(() => eventService.publishEvent(new TestEvent('bbb')))
            .catch(done.fail);
    });
    it('can change publishedAt for debug', done => {
        eventService.subscribeEvent(TestEvent, (event) => {
            expect(event.args).toBe('bbb');
            setTimeout(done, 500);
        })
            .then(() => eventService.publishEvent(new event_subscriber_1.DebugEvent(new TestEvent('bbb'), new Date(1004))))
            .catch(done.fail);
    });
    it('can unsubscribe the event', done => {
        pending('can unsubscribe the event - not implemented');
    });
    it('can subscribe the event by a pattern', done => {
        eventService.subscribePattern('test.pattern', (event) => {
            expect(event.key).toBe('test.pattern');
            setTimeout(done, 500);
        })
            .then(() => eventService.publishEvent(new TestPatternEvent('ccc')))
            .catch(done.fail);
    });
    it('can subscribe the event by an wildcard pattern', done => {
        eventService.subscribePattern('test.*', (event) => {
            expect(event.key).toBe('test.pattern');
            expect(event.args).toBe('wildcard');
            setTimeout(done, 500);
        })
            .then(() => eventService.publishEvent(new TestPatternEvent('wildcard')))
            .catch(done.fail);
    });
    afterAll(done => {
        Bluebird.delay(500)
            .then(() => eventService.purge())
            .then(() => tracelog_1.TraceLog.purge())
            .then(() => amqpChannelPool.purge())
            .then(done)
            .catch(done.fail);
    });
});
describe('PatternSubscriber', () => {
    describe('isRoutingKeyMatched', () => {
        it('should test a pattern with plain text', () => {
            const s = new event_subscriber_1.PatternSubscriber(event => {
            }, 'aaa.aaa.aaa');
            expect(s.isRoutingKeyMatched('aaa.aaa.aaa')).toBeTruthy();
            expect(s.isRoutingKeyMatched('aaa.aaa.bbb')).toBeFalsy();
        });
        it('should test a pattern using *', () => {
            const s = new event_subscriber_1.PatternSubscriber(event => {
            }, 'aaa.aaa.*');
            expect(s.isRoutingKeyMatched('aaa.aaa.aaa')).toBeTruthy();
            expect(s.isRoutingKeyMatched('aaa.aaa.bbb')).toBeTruthy();
            expect(s.isRoutingKeyMatched('aaa.bbb.aaa')).toBeFalsy();
            expect(s.isRoutingKeyMatched('aaa.aaa.aaa.aaa')).toBeFalsy();
        });
        it('should test a pattern using #', () => {
            const s = new event_subscriber_1.PatternSubscriber(event => {
            }, 'aaa.#');
            expect(s.isRoutingKeyMatched('aaa.aaa.aaa')).toBeTruthy();
            expect(s.isRoutingKeyMatched('aaa.bbb.bbb')).toBeTruthy();
            expect(s.isRoutingKeyMatched('aaa.bbb')).toBeTruthy();
            expect(s.isRoutingKeyMatched('aaa')).toBeFalsy();
            expect(s.isRoutingKeyMatched('ccc.aaa.bbb')).toBeFalsy();
        });
    });
});
describe('Event-hook', () => {
    const amqpChannelPool = new amqp_channel_pool_service_1.AmqpChannelPoolService();
    const eventService = new event_service_1.EventService(`event-service-spec`);
    beforeEach(jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield amqpChannelPool.initialize({
            url: process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672'
        });
        yield eventService.initialize(amqpChannelPool);
        yield eventService.startConsume();
    })));
    afterEach(jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield Bluebird.delay(500);
        yield tracelog_1.TraceLog.purge();
        yield eventService.purge();
        yield amqpChannelPool.purge();
    })));
    it('could change the event parameter', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        eventService.registerHook(event_service_1.EventHookType.EVENT, p => {
            return Promise.resolve('x' + p);
        });
        yield eventService.subscribeEvent(TestEvent, (event) => {
            expect(event.args).toBe('xbbb');
        });
        yield eventService.publishEvent(new TestEvent('bbb'));
    })));
    it('could reference the error object', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        eventService.registerHook(event_service_1.EventHookType.ERROR, e => {
            expect(e.message).toMatch(/custom-event-error/);
            return Promise.resolve(e);
        });
        yield eventService.subscribeEvent(TestEvent, (event) => {
            throw new Error('custom-event-error');
        });
        yield eventService.publishEvent(new TestEvent('bbb'));
    })));
});
//# sourceMappingURL=event-service.spec.js.map