"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Bluebird = require("bluebird");
const _ = require("lodash");
const uuid = require("uuid");
const error_1 = require("../utils/error");
const logger_1 = require("../utils/logger");
const reviver_1 = require("../utils/reviver");
const abstract_broker_service_1 = require("./abstract-broker-service");
class MessageBrokerService extends abstract_broker_service_1.default {
    constructor(connection, serviceName) {
        super(connection);
        this.consumerInfos = [];
        this.handlers = {};
        this.roundRobinEventQ = serviceName;
        this.fanoutEventQ = `event.${serviceName}.${uuid.v4()}`;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized)
                return;
            if (!this.roundRobinEventQ) {
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0012_ROUND_ROBIN_EVENT_Q_IS_NOT_DEFINED, 'roundRobinEventQ is not defined');
            }
            yield this.declareExchange(MessageBrokerService.EXCHANGE_NAME, 'topic', { durable: true });
            yield this.declareQueue(this.roundRobinEventQ, { durable: true, exclusive: false });
            yield this.declareQueue(this.fanoutEventQ, { exclusive: true, autoDelete: true });
            this.initialized = true;
        });
    }
    startConsume() {
        return __awaiter(this, void 0, void 0, function* () {
            const consumerInfos = yield this.consumeQueues((msg, routingKey) => this.onMessage(msg, routingKey));
            this.consumerInfos = consumerInfos;
        });
    }
    purge() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.cancelConsumes(this.consumerInfos);
            this.consumerInfos = [];
            this.initialized = false;
        });
    }
    subscribe(pattern, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkInitialized();
            yield this.bindQueue(this.roundRobinEventQ, MessageBrokerService.EXCHANGE_NAME, pattern);
            if (handler)
                this.handlers[pattern] = handler;
        });
    }
    unsubscribe(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkInitialized();
            yield this.unbindQueue(this.roundRobinEventQ, MessageBrokerService.EXCHANGE_NAME, pattern);
            delete this.handlers[pattern];
        });
    }
    subscribeFanout(pattern, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkInitialized();
            yield this.bindQueue(this.fanoutEventQ, MessageBrokerService.EXCHANGE_NAME, pattern);
            if (handler)
                this.handlers[pattern] = handler;
        });
    }
    unsubscribeFanout(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkInitialized();
            yield this.unbindQueue(this.fanoutEventQ, MessageBrokerService.EXCHANGE_NAME, pattern);
            delete this.handlers[pattern];
        });
    }
    publish(key, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkInitialized();
            yield this._publish(MessageBrokerService.EXCHANGE_NAME, key, new Buffer(JSON.stringify(msg), 'utf8'), { timestamp: +new Date() });
        });
    }
    checkInitialized() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized)
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0013_NOT_INITIALIZED, 'not initialized');
        });
    }
    onMessage(msg, routingKey) {
        _.keys(this.handlers).forEach(pattern => {
            const matcher = this.matcher(pattern);
            Bluebird.try(() => {
                if (matcher.test(routingKey))
                    this.handlers[pattern](msg, routingKey);
            }).catch(e => {
                logger_1.logger.debug('[handle msg error]', e);
                const error = new error_1.LogicError(error_1.ISLAND.LOGIC.L0006_HANDLE_MESSAGE_ERROR, e.message);
                logger_1.logger.debug(error.stack);
                throw e;
            });
        });
    }
    matcher(pattern) {
        const splits = pattern.split('.');
        return new RegExp(splits.map(s => {
            return s === '*' ? '[a-zA-Z0-9]*' : (s === '#' ? '[a-zA-Z0-9.]' : s);
        }).join('.'));
    }
    consumeQueues(handler, options) {
        if (!this.initialized)
            return Promise.reject(new error_1.FatalError(error_1.ISLAND.FATAL.F0013_NOT_INITIALIZED, 'Not initialized'));
        return Promise.resolve(Bluebird.map([this.roundRobinEventQ, this.fanoutEventQ], queue => {
            return this._consume(queue, msg => {
                let decodedParams;
                try {
                    decodedParams = JSON.parse(msg.content.toString('utf8'), reviver_1.default);
                    handler(decodedParams, msg.fields.routingKey);
                }
                catch (e) {
                    this.publish('log.eventError', {
                        error: e,
                        event: msg.fields.routingKey,
                        params: decodedParams || null
                    });
                }
                return Promise.resolve(0);
            }, 'MSG-BROKER', options);
        }));
    }
    cancelConsumes(consumeInfos) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkInitialized();
            if (!consumeInfos)
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0015_TAG_IS_UNDEFINED, 'Tag is undefined');
            yield Bluebird.map(consumeInfos, consumeInfo => this._cancel(consumeInfo));
        });
    }
}
MessageBrokerService.EXCHANGE_NAME = 'MESSAGE_BROKER_EXCHANGE';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MessageBrokerService;
//# sourceMappingURL=message-broker-service.js.map