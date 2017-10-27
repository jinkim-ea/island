"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const _ = require("lodash");
const error_1 = require("../utils/error");
const logger_1 = require("../utils/logger");
const msgpack_1 = require("../utils/msgpack");
const SERIALIZE_FORMAT_PUSH = process.env.SERIALIZE_FORMAT_PUSH;
exports.BroadcastTargets = ['all', 'pc', 'mobile'];
class PushService {
    constructor() {
    }
    static encode(obj) {
        try {
            let buf;
            switch (SERIALIZE_FORMAT_PUSH) {
                case 'json':
                    buf = new Buffer(JSON.stringify(obj));
                    break;
                default:
                    buf = PushService.msgpack.encode(obj);
                    break;
            }
            return buf;
        }
        catch (e) {
            e.formatType = SERIALIZE_FORMAT_PUSH;
            logger_1.logger.debug('[JSON ENCODE ERROR]', e);
            const error = new error_1.LogicError(error_1.ISLAND.LOGIC.L0007_PUSH_ENCODE_ERROR, e.message);
            logger_1.logger.debug(error.stack);
            throw e;
        }
    }
    static decode(buf) {
        let obj;
        switch (SERIALIZE_FORMAT_PUSH) {
            case 'json':
                obj = JSON.parse(buf.toString());
                break;
            default:
                obj = PushService.msgpack.decode(buf);
                break;
        }
        return obj;
    }
    initialize(channelPool) {
        return __awaiter(this, void 0, void 0, function* () {
            this.channelPool = channelPool;
            yield this.channelPool.usingChannel((channel) => __awaiter(this, void 0, void 0, function* () {
                const playerPushX = PushService.playerPushExchange;
                const broadcastExchange = PushService.broadcastExchange;
                _.forEach(broadcastExchange.name, (name) => __awaiter(this, void 0, void 0, function* () {
                    yield channel.assertExchange(name, broadcastExchange.type, PushService.broadcastExchange.options);
                }));
                yield channel.assertExchange(playerPushX.name, playerPushX.type, playerPushX.options);
                yield channel.assertQueue(PushService.autoDeleteTriggerQueue.name, PushService.autoDeleteTriggerQueue.options);
                yield channel.bindExchange(PushService.broadcastExchange.name.pc, PushService.broadcastExchange.name.all, '');
                yield channel.bindExchange(PushService.broadcastExchange.name.mobile, PushService.broadcastExchange.name.all, '');
            }));
        });
    }
    purge() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    deleteExchange(exchange, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.channelPool.usingChannel(channel => {
                logger_1.logger.debug(`[INFO] delete exchange's name ${exchange}`);
                return channel.deleteExchange(exchange, options);
            });
        });
    }
    /**
     * bind specific exchange wrapper
     * @param destination
     * @param source
     * @param pattern
     * @param sourceType
     * @param sourceOpts
     * @returns {Promise<any>}
     */
    bindExchange(destination, source, pattern = '', sourceType = 'fanout', sourceOpts = PushService.DEFAULT_EXCHANGE_OPTIONS) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.debug(`bind exchange. ${source} ==${pattern}==> ${destination}`);
            let sourceDeclared = false;
            try {
                yield this.channelPool.usingChannel((channel) => __awaiter(this, void 0, void 0, function* () {
                    yield channel.assertExchange(source, sourceType, sourceOpts);
                    sourceDeclared = true;
                    yield channel.bindExchange(destination, source, pattern);
                }));
            }
            catch (e) {
                // Auto-delete is triggered only when target exchange(or queue) is unbound or deleted.
                // If previous bind fails, we can't ensure auto-delete triggered or not.
                // Below workaround prevents this from happening.
                // caution: Binding x-recent-history exchange to unroutable target causes connection loss.
                // target should be a queue and routable.
                if (sourceDeclared && sourceOpts.autoDelete) {
                    yield this.channelPool.usingChannel((channel) => __awaiter(this, void 0, void 0, function* () {
                        yield channel.bindQueue(PushService.autoDeleteTriggerQueue.name, source, '');
                        yield channel.unbindQueue(PushService.autoDeleteTriggerQueue.name, source, '');
                    }));
                }
                throw e;
            }
        });
    }
    /**
     * unbind exchange wrapper
     * @param destination
     * @param source
     * @param pattern
     * @returns {Promise<any>}
     */
    unbindExchange(destination, source, pattern = '') {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.debug(`unbind exchange; ${source} --${pattern}--X ${destination}`);
            return this.channelPool.usingChannel(channel => {
                return channel.unbindExchange(destination, source, pattern, {});
            });
        });
    }
    /**
     * bind specific queue wrapper
     * @param queue
     * @param source
     * @param pattern
     * @param sourceType
     * @param sourceOpts
     * @returns {Promise<any>}
     */
    bindQueue(queue, source, pattern = '', sourceType = 'fanout', sourceOpts = PushService.DEFAULT_EXCHANGE_OPTIONS) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.debug(`bind queue. ${source} ==${pattern}==> ${queue}`);
            let sourceDeclared = false;
            try {
                yield this.channelPool.usingChannel((channel) => __awaiter(this, void 0, void 0, function* () {
                    yield channel.assertExchange(source, sourceType, sourceOpts);
                    sourceDeclared = true;
                    yield channel.bindQueue(queue, source, pattern);
                }));
            }
            catch (e) {
                // Auto-delete is triggered only when target exchange(or queue) is unbound or deleted.
                // If previous bind fails, we can't ensure auto-delete triggered or not.
                // Below workaround prevents this from happening.
                // caution: Binding x-recent-history exchange to unroutable target causes connection loss.
                // target should be a queue and routable.
                if (sourceDeclared && sourceOpts.autoDelete) {
                    yield this.channelPool.usingChannel((channel) => __awaiter(this, void 0, void 0, function* () {
                        yield channel.bindQueue(PushService.autoDeleteTriggerQueue.name, source, '');
                        yield channel.unbindQueue(PushService.autoDeleteTriggerQueue.name, source, '');
                    }));
                }
                throw e;
            }
        });
    }
    /**
     * unbind queue wrapper
     * @param queue
     * @param source
     * @param pattern
     * @returns {Promise<any>}
     */
    unbindQueue(queue, source, pattern = '') {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.debug(`unbind queue; ${source} --${pattern}--X ${queue}`);
            return this.channelPool.usingChannel(channel => {
                return channel.unbindQueue(queue, source, pattern, {});
            });
        });
    }
    /**
     * publish message to a player
     * @param pid
     * @param msg
     * @param options
     * @returns {Promise<any>}
     */
    unicast(pid, msg, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.channelPool.usingChannel((channel) => __awaiter(this, void 0, void 0, function* () {
                return channel.publish(PushService.playerPushExchange.name, pid, PushService.encode(msg), options);
            }));
        });
    }
    /**
     * publish message to specific exchange
     * @param exchange
     * @param msg
     * @param routingKey
     * @param options
     * @returns {Promise<any>}
     */
    multicast(exchange, msg, routingKey = '', options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.channelPool.usingChannel((channel) => __awaiter(this, void 0, void 0, function* () {
                return channel.publish(exchange, routingKey, PushService.encode(msg), options);
            }));
        });
    }
    /**
     * publish message to global fanout exchange
     * @param msg message to broadcast. message should be MessagePack encodable.
     * @param options publish options
     * @returns {Promise<any>}
     */
    broadcast(msg, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.channelPool.usingChannel((channel) => __awaiter(this, void 0, void 0, function* () {
                const target = options && options.broadcastTarget || 'all';
                const fanout = PushService.broadcastExchange.name[target];
                return channel.publish(fanout, '', PushService.encode(msg), options);
            }));
        });
    }
}
// Exchange to broadcast to the entire users.
PushService.broadcastExchange = {
    name: {
        all: 'PUSH_FANOUT_EXCHANGE',
        pc: 'PUSH_PC_FANOUT_EXCHANGE',
        mobile: 'PUSH_MOBILE_FANOUT_EXCHANGE'
    },
    options: {
        durable: true
    },
    type: 'fanout'
};
// Exchange to push to a specific user.
PushService.playerPushExchange = {
    name: 'push.player',
    options: {
        durable: true
    },
    type: 'direct'
};
PushService.msgpack = msgpack_1.default.getInst();
PushService.DEFAULT_EXCHANGE_OPTIONS = {
    autoDelete: true,
    durable: true
};
PushService.autoDeleteTriggerQueue = {
    name: 'auto-delete.trigger',
    options: {
        messageTtl: 0
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PushService;
//# sourceMappingURL=push-service.js.map