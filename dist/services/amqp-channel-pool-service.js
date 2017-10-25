"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const amqp = require("amqplib");
const Bluebird = require("bluebird");
const _ = require("lodash");
const util = require("util");
const logger_1 = require("../utils/logger");
class AmqpChannelPoolService {
    constructor() {
        this.openChannels = [];
        this.idleChannels = [];
        this.initResolver = Bluebird.defer();
    }
    initialize(options) {
        return __awaiter(this, void 0, void 0, function* () {
            options.poolSize = options.poolSize || AmqpChannelPoolService.DEFAULT_POOL_SIZE;
            this.options = options;
            logger_1.logger.info(`connecting to broker ${util.inspect(options, { colors: true })}`);
            try {
                const connection = yield amqp.connect(options.url, options.socketOptions);
                logger_1.logger.info(`connected to ${options.url} for ${options.name}`);
                this.connection = connection;
                this.initResolver.resolve();
            }
            catch (e) {
                this.initResolver.reject(e);
            }
            return Promise.resolve(this.initResolver.promise);
        });
    }
    getPrefetchCount() {
        return this.options.prefetchCount;
    }
    waitForInit() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.initResolver.promise;
        });
    }
    purge() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.connection.close();
        });
    }
    acquireChannel() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(Bluebird.try(() => {
                const info = this.idleChannels.shift();
                return info && info.channel || this.createChannel();
            }));
        });
    }
    releaseChannel(channel, reusable = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!_.includes(this.openChannels, channel)) {
                return;
            }
            if (reusable && this.idleChannels.length < this.options.poolSize) {
                this.idleChannels.push({ channel, date: +new Date() });
                return;
            }
            return channel.close();
        });
    }
    usingChannel(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return Bluebird.using(this.getChannelDisposer(), task);
        });
    }
    getChannelDisposer() {
        return Bluebird.resolve(this.acquireChannel())
            .disposer((channel) => {
            this.releaseChannel(channel, true);
        });
    }
    createChannel() {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = yield this.connection.createChannel();
            this.setChannelEventHandler(channel);
            this.openChannels.push(channel);
            return channel;
        });
    }
    setChannelEventHandler(channel) {
        channel
            .on('error', err => {
            logger_1.logger.notice('amqp channel error:', err);
            if (err.stack) {
                logger_1.logger.debug(err.stack);
            }
        })
            .on('close', () => {
            _.remove(this.idleChannels, (cur) => {
                return cur.channel === channel;
            });
            _.pull(this.openChannels, channel);
        });
    }
}
AmqpChannelPoolService.DEFAULT_POOL_SIZE = 100;
exports.AmqpChannelPoolService = AmqpChannelPoolService;
//# sourceMappingURL=amqp-channel-pool-service.js.map