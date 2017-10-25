"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const event_service_1 = require("../../services/event-service");
const error_1 = require("../../utils/error");
const listenable_adapter_1 = require("../listenable-adapter");
class EventAdapter extends listenable_adapter_1.default {
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options)
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
            this._adaptee = new event_service_1.EventService(this.options.serviceName || 'unknownService');
            const amqpChannelPoolService = this.options.amqpChannelPoolAdapter.adaptee;
            if (!amqpChannelPoolService) {
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0008_AMQP_CHANNEL_POOL_REQUIRED, 'AmqpChannelPoolService required');
            }
            yield amqpChannelPoolService.waitForInit();
            return this._adaptee.initialize(amqpChannelPoolService);
        });
    }
    listen() {
        return this.adaptee.startConsume();
    }
    destroy() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("destroy").call(this);
            return this.adaptee.purge();
        });
    }
}
exports.EventAdapter = EventAdapter;
//# sourceMappingURL=event-adapter.js.map