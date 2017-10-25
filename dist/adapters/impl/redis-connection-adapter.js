"use strict";
const Promise = require("bluebird");
const redis = require("redis-bluebird");
const error_1 = require("../../utils/error");
const abstract_adapter_1 = require("../abstract-adapter");
/**
 * RedisConnectionAdapter
 * @class
 * @extends AbstractAdapter
 */
class RedisConnectionAdapter extends abstract_adapter_1.default {
    /**
     * Initialize the redis connection.
     * @returns {Promise<void>}
     * @override
     */
    initialize() {
        if (!this.options)
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
        const options = this.options;
        return new Promise((resolve, reject) => {
            const client = redis.createClient(options.port, options.host, options.clientOpts);
            // Although all commands before the connection are accumulated in the queue,
            // Make sure for the case of using a external redis connector.
            client.once('ready', () => {
                this._adaptee = client;
                client.removeAllListeners();
                resolve();
            });
            client.once('error', err => {
                reject(err);
            });
        });
    }
    destroy() {
        return this._adaptee.quit();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RedisConnectionAdapter;
//# sourceMappingURL=redis-connection-adapter.js.map