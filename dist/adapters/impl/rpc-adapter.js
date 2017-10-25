"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const rpc_service_1 = require("../../services/rpc-service");
const error_1 = require("../../utils/error");
const listenable_adapter_1 = require("../listenable-adapter");
class RPCAdapter extends listenable_adapter_1.default {
    constructor(options) {
        super(options);
        this.hooks = [];
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options)
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
            this._adaptee = new rpc_service_1.default(this.options.serviceName || 'unknownService');
            const amqpChannelPoolService = this.options.amqpChannelPoolAdapter.adaptee;
            if (!amqpChannelPoolService) {
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0008_AMQP_CHANNEL_POOL_REQUIRED, 'AmqpChannelPoolService required');
            }
            yield amqpChannelPoolService.waitForInit();
            this.hooks.forEach(hook => {
                this._adaptee.registerHook(hook.type, hook.hook);
            });
            return this._adaptee.initialize(amqpChannelPoolService, { noReviver: this.options.noReviver });
        });
    }
    listen() {
        return this._adaptee.listen();
    }
    destroy() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("destroy").call(this);
            return this.adaptee.purge();
        });
    }
    registerHook(type, hook) {
        this.hooks.push({ type, hook });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RPCAdapter;
//# sourceMappingURL=rpc-adapter.js.map