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
function pushSafe(object, arrayName, element) {
    const array = object[arrayName] = object[arrayName] || [];
    array.push(element);
}
function rpc(rpcOptions) {
    return (target, name, desc) => {
        const handler = desc.value;
        const options = _.merge({}, handler.options || {}, rpcOptions);
        const endpoint = { name, options, handler };
        pushSafe(handler, 'endpoints', endpoint);
        const constructor = target.constructor;
        pushSafe(constructor, '_endpointMethods', endpoint);
    };
}
exports.rpc = rpc;
function rpcController(registerer) {
    return target => {
        const _onInitialized = target.prototype.onInitialized;
        // tslint:disable-next-line
        target.prototype.onInitialized = function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield Promise.all(_.map(target._endpointMethods, (v) => {
                    const developmentOnly = _.get(v, 'options.developmentOnly');
                    if (developmentOnly && process.env.NODE_ENV !== 'development')
                        return Promise.resolve();
                    return this.server.register(v.name, v.handler.bind(this), 'rpc', v.options).then(() => {
                        return registerer && registerer.registerRpc(v.name, v.options || {}) || Promise.resolve();
                    });
                }));
                return _onInitialized.apply(this);
            });
        };
    };
}
exports.rpcController = rpcController;
//# sourceMappingURL=rpc-decorator.js.map