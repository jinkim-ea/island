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
const error_1 = require("../utils/error");
const abstract_adapter_1 = require("./abstract-adapter");
/**
 * Abstract adapter class for back-end service.
 * @abstract
 * @class
 * @extends AbstractAdapter
 * @implements IListenableAdapter
 */
class ListenableAdapter extends abstract_adapter_1.default {
    constructor() {
        super(...arguments);
        this._controllersClasses = [];
        this._controllers = [];
    }
    /**
     * @param {AbstractController} Class
     */
    registerController(Class) {
        this._controllersClasses.push(Class);
    }
    /**
     * @returns {Promise<void>}
     * @final
     */
    postInitialize() {
        return Promise.all(this._controllersClasses.map(ControllerClass => {
            const c = new ControllerClass(this._adaptee);
            this._controllers.push(c);
            return Bluebird.try(() => c.initialize()).then(() => c.onInitialized());
        }));
    }
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    listen() {
        throw new error_1.FatalError(error_1.ISLAND.FATAL.F0004_NOT_IMPLEMENTED_ERROR, 'Not implemented error');
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this._controllers.map(c => Bluebird.try(() => c.destroy())));
            yield Promise.all(this._controllers.map(c => Bluebird.try(() => c.onDestroy())));
            this._controllersClasses = [];
            this._controllers = [];
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ListenableAdapter;
//# sourceMappingURL=listenable-adapter.js.map