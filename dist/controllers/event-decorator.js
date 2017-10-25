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
const event_1 = require("../utils/event");
function eventController(target) {
    const _onInitialized = target.prototype.onInitialized;
    // tslint:disable-next-line
    target.prototype.onInitialized = function () {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield _onInitialized.apply(this);
            const constructor = target;
            constructor._eventSubscriptions = event_1.DEFAULT_SUBSCRIPTIONS.concat(constructor._eventSubscriptions || []);
            return Bluebird.map(constructor._eventSubscriptions || [], ({ eventClass, handler, options }) => {
                return this.server.subscribeEvent(eventClass, handler.bind(this), options);
            })
                .then(() => Bluebird.map(constructor._patternSubscriptions || [], ({ pattern, handler, options }) => {
                return this.server.subscribePattern(pattern, handler.bind(this), options);
            }))
                .then(() => result);
        });
    };
}
exports.eventController = eventController;
function subscribeEvent(eventClass, options) {
    return (target, propertyKey, desc) => {
        const constructor = target.constructor;
        constructor._eventSubscriptions = constructor._eventSubscriptions || [];
        constructor._eventSubscriptions.push({
            eventClass,
            handler: desc.value,
            options
        });
    };
}
exports.subscribeEvent = subscribeEvent;
function subscribePattern(pattern, options) {
    return (target, propertyKey, desc) => {
        const constructor = target.constructor;
        constructor._patternSubscriptions = constructor._patternSubscriptions || [];
        constructor._patternSubscriptions.push({
            pattern,
            handler: desc.value,
            options
        });
    };
}
exports.subscribePattern = subscribePattern;
//# sourceMappingURL=event-decorator.js.map