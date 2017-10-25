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
const amqp_channel_pool_service_1 = require("../services/amqp-channel-pool-service");
const TRACE_QUEUE_NAME_OPTIONS = {
    autoDelete: true,
    durable: false,
    exclusive: false
};
class TraceLog {
    constructor(tattoo, created) {
        this.data = { ts: {} };
        this.data.tattoo = tattoo;
        this.data.ts.c = created;
        this.data.ts.r = +(new Date());
    }
    static initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!process.env.ISLAND_TRACEMQ_HOST)
                return;
            if (TraceLog.channelPool)
                return;
            TraceLog.channelPool = new amqp_channel_pool_service_1.AmqpChannelPoolService();
            yield TraceLog.channelPool.initialize({ url: process.env.ISLAND_TRACEMQ_HOST });
            return yield TraceLog.channelPool.usingChannel(channel => {
                return channel.assertQueue(process.env.ISLAND_TRACEMQ_QUEUE || 'trace', TRACE_QUEUE_NAME_OPTIONS);
            });
        });
    }
    static purge() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TraceLog.channelPool)
                return;
            yield TraceLog.channelPool.purge();
            delete (TraceLog.channelPool);
            return Promise.resolve();
        });
    }
    set size(size) {
        this.data.size = size;
    }
    set from(from) {
        this.data.from = from;
    }
    set to(to) {
        this.data.to = to;
    }
    end(error) {
        this.data.ts.e = +(new Date());
        this.data.error = !!error;
    }
    shoot() {
        if (!TraceLog.channelPool)
            return Promise.resolve();
        return Promise.resolve(Bluebird.try(() => {
            const content = new Buffer(JSON.stringify(this.data), 'utf8');
            const queueName = process.env.ISLAND_TRACEMQ_QUEUE || 'trace';
            return TraceLog.channelPool.usingChannel(channel => {
                return Promise.resolve(channel.sendToQueue(queueName, content));
            });
        }));
    }
}
exports.TraceLog = TraceLog;
//# sourceMappingURL=tracelog.js.map