"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const amqp_channel_pool_service_1 = require("../../services/amqp-channel-pool-service");
const error_1 = require("../../utils/error");
const abstract_adapter_1 = require("../abstract-adapter");
class AmqpChannelPoolAdapter extends abstract_adapter_1.default {
    initialize() {
        if (!this.options)
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
        this._adaptee = new amqp_channel_pool_service_1.AmqpChannelPoolService();
        return this._adaptee.initialize(this.options);
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: should wait until other services stops using AmqpChannelPoolService
            return this._adaptee.purge();
        });
    }
}
exports.AmqpChannelPoolAdapter = AmqpChannelPoolAdapter;
//# sourceMappingURL=amqp-channel-pool-adapter.js.map