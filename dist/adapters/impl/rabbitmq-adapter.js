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
const error_1 = require("../../utils/error");
const listenable_adapter_1 = require("../listenable-adapter");
class RabbitMqAdapter extends listenable_adapter_1.default {
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options)
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
            const options = this.options;
            const connection = yield Promise.resolve(amqp.connect(options.url, options.socketOptions));
            this.connection = connection;
        });
    }
    listen() {
        return Promise.resolve();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RabbitMqAdapter;
//# sourceMappingURL=rabbitmq-adapter.js.map