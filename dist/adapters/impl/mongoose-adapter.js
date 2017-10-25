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
const dns = require("dns");
const mongodbUri = require("mongodb-uri");
const mongoose = require("mongoose");
const error_1 = require("../../utils/error");
const abstract_adapter_1 = require("../abstract-adapter");
/**
 * MongooseAdapter
 * @class
 * @extends AbstractAdapter
 */
class MongooseAdapter extends abstract_adapter_1.default {
    /**
     * Initialize the mongoose connection.
     * @returns {Promise<void>}
     * @override
     */
    initialize() {
        return new Promise((resolve, reject) => {
            if (!this.options)
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
            // Mongoose buffers all the commands until it's connected to the database.
            // But make sure to the case of using a external mongodb connector
            const uri = this.options.uri;
            const connectionOptions = this.options.connectionOptions;
            this.dnsLookup(uri).then(address => {
                const connection = mongoose.createConnection(address, connectionOptions);
                connection.once('open', () => {
                    this._adaptee = connection;
                    connection.removeAllListeners();
                    resolve();
                });
                connection.once('error', err => {
                    reject(err);
                });
            });
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._adaptee.close();
        });
    }
    dnsLookup(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const h = mongodbUri.parse(uri);
            yield Bluebird.map(h.hosts, ((host) => __awaiter(this, void 0, void 0, function* () {
                host.host = yield this.convert(host.host);
            })));
            return mongodbUri.format(h);
        });
    }
    convert(host) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                dns.lookup(host, (err, ip) => {
                    if (err)
                        return reject(err);
                    return resolve(ip);
                });
            });
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MongooseAdapter;
//# sourceMappingURL=mongoose-adapter.js.map