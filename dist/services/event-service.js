"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cls = require("continuation-local-storage");
const Bluebird = require("bluebird");
const _ = require("lodash");
const uuid = require("uuid");
const event_1 = require("../utils/event");
const logger_1 = require("../utils/logger");
const reviver_1 = require("../utils/reviver");
const tracelog_1 = require("../utils/tracelog");
const status_exporter_1 = require("../utils/status-exporter");
const event_subscriber_1 = require("./event-subscriber");
var EventHookType;
(function (EventHookType) {
    EventHookType[EventHookType["EVENT"] = 0] = "EVENT";
    EventHookType[EventHookType["ERROR"] = 1] = "ERROR";
})(EventHookType = exports.EventHookType || (exports.EventHookType = {}));
function enterScope(properties, func) {
    return new Promise((resolve, reject) => {
        const ns = cls.getNamespace('app');
        ns.run(() => {
            _.each(properties, (value, key) => {
                ns.set(key, value);
            });
            Bluebird.try(func).then(resolve).catch(reject);
        });
    });
}
class EventService {
    constructor(serviceName) {
        this.subscribers = [];
        this.hooks = {};
        this.onGoingEventRequestCount = 0;
        this.purging = null;
        this.serviceName = serviceName;
        this.roundRobinQ = `event.${serviceName}`;
        this.fanoutQ = `event.${serviceName}.node.${uuid.v4()}`;
    }
    initialize(channelPool) {
        return __awaiter(this, void 0, void 0, function* () {
            yield tracelog_1.TraceLog.initialize();
            this.channelPool = channelPool;
            return channelPool.usingChannel(channel => {
                return channel.assertExchange(EventService.EXCHANGE_NAME, 'topic', { durable: true })
                    .then(() => channel.assertQueue(this.roundRobinQ, { durable: true, exclusive: false }))
                    .then(() => channel.assertQueue(this.fanoutQ, { exclusive: true, autoDelete: true }));
            });
        });
    }
    startConsume() {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = yield this.channelPool.acquireChannel();
            yield Bluebird.map([this.roundRobinQ, this.fanoutQ], queue => {
                this.registerConsumer(channel, queue);
            });
            this.publishEvent(new event_1.Events.SystemNodeStarted({ name: this.fanoutQ, island: this.serviceName }));
        });
    }
    purge() {
        return __awaiter(this, void 0, void 0, function* () {
            this.hooks = {};
            if (!this.subscribers)
                return Promise.resolve();
            return Promise.all(_.map(this.subscribers, (subscriber) => __awaiter(this, void 0, void 0, function* () {
                logger_1.logger.info('stop consuming', subscriber.getRoutingPattern());
                yield this.unsubscribe(subscriber);
            })))
                .then(() => {
                this.subscribers = [];
                if (this.onGoingEventRequestCount > 0) {
                    return new Promise((res, rej) => { this.purging = res; });
                }
                return Promise.resolve();
            });
        });
    }
    subscribeEvent(eventClass, handler, options) {
        return Promise.resolve(Bluebird.try(() => new event_subscriber_1.EventSubscriber(handler, eventClass))
            .then(subscriber => this.subscribe(subscriber, options)));
    }
    subscribePattern(pattern, handler, options) {
        return Promise.resolve(Bluebird.try(() => new event_subscriber_1.PatternSubscriber(handler, pattern))
            .then(subscriber => this.subscribe(subscriber, options)));
    }
    publishEvent(...args) {
        let exchange = EventService.EXCHANGE_NAME;
        let event;
        if (args.length === 1) {
            event = args[0];
        }
        else {
            exchange = args[0];
            event = args[1];
        }
        const ns = cls.getNamespace('app');
        const tattoo = ns.get('RequestTrackId');
        const context = ns.get('Context');
        const type = ns.get('Type');
        const sessionType = ns.get('sessionType');
        logger_1.logger.debug(`publish ${event.key}`, event.args, tattoo);
        const options = {
            headers: {
                tattoo,
                from: { node: process.env.HOSTNAME, context, island: this.serviceName, type },
                extra: { sessionType }
            },
            timestamp: +event.publishedAt || +new Date()
        };
        return Promise.resolve(Bluebird.try(() => new Buffer(JSON.stringify(event.args), 'utf8'))
            .then(content => {
            return this._publish(EventService.EXCHANGE_NAME, event.key, content, options);
        }));
    }
    registerHook(type, hook) {
        this.hooks[type] = this.hooks[type] || [];
        this.hooks[type].push(hook);
    }
    registerConsumer(channel, queue) {
        const prefetchCount = this.channelPool.getPrefetchCount();
        return Promise.resolve(channel.prefetch(prefetchCount || +process.env.EVENT_PREFETCH || 100))
            .then(() => channel.consume(queue, msg => {
            if (!msg) {
                logger_1.logger.error(`consume was canceled unexpectedly`);
                // TODO: handle unexpected cancel
                return;
            }
            const timestamp = msg.properties && msg.properties.timestamp;
            const startedAt = +new Date();
            status_exporter_1.exporter.collectRequestAndReceivedTime('event', startedAt - timestamp);
            this.onGoingEventRequestCount++;
            Bluebird.resolve(this.handleMessage(msg))
                .tap(() => status_exporter_1.exporter.collectExecutedCountAndExecutedTime('event', +new Date() - startedAt))
                .catch(e => this.sendErrorLog(e, msg))
                .finally(() => {
                channel.ack(msg);
                if (--this.onGoingEventRequestCount < 1 && this.purging) {
                    this.purging();
                }
                // todo: fix me. we're doing ACK always even if promise rejected.
                // todo: how can we handle the case subscribers succeeds or fails partially
            });
        }));
        // TODO: save channel and consumer tag
    }
    sendErrorLog(err, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.error(`error on handling event`, err);
            if ('ExpectedError' === err.name)
                return;
            if ('log.error' === msg.fields.routingKey)
                return; // preventing loop
            const errorLog = {
                message: err.message,
                params: (() => {
                    try {
                        return JSON.parse(msg.content.toString('utf8'), reviver_1.default);
                    }
                    catch (e) {
                        return msg.content;
                    }
                })(),
                stack: err.stack
            };
            _.assign(errorLog, err);
            return this.publishEvent(new event_subscriber_1.BaseEvent('log.error', errorLog));
        });
    }
    dohook(type, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hooks[type])
                return value;
            return Bluebird.reduce(this.hooks[type], (value, hook) => __awaiter(this, void 0, void 0, function* () { return yield hook(value); }), value);
        });
    }
    handleMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = msg.properties.headers;
            const tattoo = headers && headers.tattoo;
            const extra = headers && headers.extra || {};
            const content = yield this.dohook(EventHookType.EVENT, JSON.parse(msg.content.toString('utf8'), reviver_1.default));
            const subscribers = this.subscribers.filter(subscriber => subscriber.isRoutingKeyMatched(msg.fields.routingKey));
            const promise = Bluebird.map(subscribers, subscriber => {
                const clsProperties = _.merge({ RequestTrackId: tattoo, Context: msg.fields.routingKey, Type: 'event' }, extra);
                return enterScope(clsProperties, () => {
                    logger_1.logger.debug(`${msg.fields.routingKey}`, content, msg.properties.headers);
                    const log = new tracelog_1.TraceLog(tattoo, msg.properties.timestamp || 0);
                    log.size = msg.content.byteLength;
                    log.from = headers.from;
                    log.to = {
                        context: msg.fields.routingKey,
                        island: this.serviceName,
                        node: process.env.HOSTNAME,
                        type: 'event'
                    };
                    return Bluebird.resolve(subscriber.handleEvent(content, msg))
                        .then(() => {
                        log.end();
                    })
                        .catch((e) => __awaiter(this, void 0, void 0, function* () {
                        if (!e.extra || typeof e.extra === 'object') {
                            e.extra = _.assign({
                                args: content,
                                event: msg.fields.routingKey,
                                island: this.serviceName
                            }, e.extra);
                        }
                        e = yield this.dohook(EventHookType.ERROR, e);
                        log.end(e);
                        throw e;
                    }))
                        .finally(() => {
                        log.shoot();
                    });
                });
            });
            return Promise.resolve(promise);
        });
    }
    subscribe(subscriber, options) {
        options = options || {};
        subscriber.setQueue(options.everyNodeListen && this.fanoutQ || this.roundRobinQ);
        return this.channelPool.usingChannel(channel => {
            return channel.bindQueue(subscriber.getQueue(), EventService.EXCHANGE_NAME, subscriber.getRoutingPattern());
        })
            .then(() => {
            this.subscribers.push(subscriber);
        });
    }
    _publish(exchange, routingKey, content, options) {
        return this.channelPool.usingChannel(channel => {
            return Promise.resolve(channel.publish(exchange, routingKey, content, options));
        });
    }
    unsubscribe(subscriber) {
        const queue = subscriber.getQueue();
        if (!queue)
            return;
        return this.channelPool.usingChannel(channel => {
            if (queue === this.roundRobinQ)
                return channel.unbindExchange(queue, EventService.EXCHANGE_NAME, subscriber.getRoutingPattern());
            return channel.unbindQueue(queue, EventService.EXCHANGE_NAME, subscriber.getRoutingPattern());
        });
    }
}
EventService.EXCHANGE_NAME = 'MESSAGE_BROKER_EXCHANGE';
exports.EventService = EventService;
//# sourceMappingURL=event-service.js.map