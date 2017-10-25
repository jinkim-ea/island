"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const error_1 = require("../utils/error");
const msgpack_1 = require("../utils/msgpack");
class AbstractBrokerService {
    constructor(connection, options = {}) {
        this.connection = connection;
        this.options = options;
        this.msgpack = msgpack_1.default.getInst();
    }
    initialize() {
        return Promise.reject(new error_1.FatalError(error_1.ISLAND.FATAL.F0011_NOT_INITIALIZED_EXCEPTION, 'Not initialized exception'));
    }
    declareExchange(name, type, options) {
        return this.call((channel) => channel.assertExchange(name, type, options));
    }
    deleteExchage(name, options) {
        return this.call((channel) => channel.deleteExchange(name, options));
    }
    declareQueue(name, options) {
        return this.call((channel) => channel.assertQueue(name, options));
    }
    deleteQueue(name, options) {
        return this.call((channel) => channel.deleteQueue(name, options));
    }
    bindQueue(queue, source, pattern, args) {
        return this.call((channel) => channel.bindQueue(queue, source, pattern || '', args));
    }
    unbindQueue(queue, source, pattern, args) {
        return this.call((channel) => channel.unbindQueue(queue, source, pattern || '', args));
    }
    sendToQueue(queue, content, options) {
        return this.call((channel) => channel.sendToQueue(queue, content, options));
    }
    ack(message, allUpTo) {
        return this.call((channel) => channel.ack(message, allUpTo));
    }
    _consume(key, handler, tag, options) {
        return this.call((channel) => {
            const myHandler = (msg) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield handler(msg);
                    channel.ack(msg);
                }
                catch (error) {
                    if (error.type && parseInt(error.type, 10) === 503) {
                        setTimeout(() => {
                            channel.nack(msg);
                        }, 1000);
                        return;
                    }
                    throw error;
                }
                // if (!(options && options.noAck)) {
                //   channel.ack(msg);  // delivery-tag 가 channel 내에서만 유효하기 때문에 여기서 해야됨.
                // }
            });
            return channel.consume(key, myHandler, options || {})
                .then(result => ({ channel, tag: result.consumerTag }));
        }, true);
    }
    _cancel(consumerInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield consumerInfo.channel.cancel(consumerInfo.tag);
            yield consumerInfo.channel.close();
            return result;
        });
    }
    _publish(exchange, routingKey, content, options) {
        return this.call((channel) => channel.publish(exchange, routingKey, content, options));
    }
    getChannel() {
        return Promise.resolve(this.connection.createChannel());
    }
    call(handler, ignoreClosingChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = yield this.getChannel();
            channel.on('error', err => {
                console.log('channel error:', err);
                if (err.stack) {
                    console.log(err.stack);
                }
            });
            const ok = yield handler(channel);
            if (!ignoreClosingChannel) {
                channel.close();
            }
            return ok;
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AbstractBrokerService;
//# sourceMappingURL=abstract-broker-service.js.map