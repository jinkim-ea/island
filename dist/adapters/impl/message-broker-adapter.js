"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const message_broker_service_1 = require("../../services/message-broker-service");
const error_1 = require("../../utils/error");
const rabbitmq_adapter_1 = require("./rabbitmq-adapter");
class MessageBrokerAdapter extends rabbitmq_adapter_1.default {
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("initialize").call(this);
            if (!this.options)
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
            this._adaptee = new message_broker_service_1.default(this.connection, this.options.serviceName || 'unknownService');
            return this._adaptee.initialize();
        });
    }
    listen() {
        return this._adaptee.startConsume();
    }
    destroy() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("destroy").call(this);
            return this._adaptee.purge();
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MessageBrokerAdapter;
//# sourceMappingURL=message-broker-adapter.js.map