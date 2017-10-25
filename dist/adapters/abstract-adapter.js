"use strict";
const error_1 = require("../utils/error");
/**
 * Abstract adapter class for back-end service.
 * @abstract
 * @class
 * @implements IAbstractAdapter
 */
class AbstractAdapter {
    constructor(options) {
        this._options = options;
    }
    get adaptee() { return this._adaptee; }
    get options() { return this._options; }
    initialize() {
        throw new error_1.FatalError(error_1.ISLAND.FATAL.F0004_NOT_IMPLEMENTED_ERROR, 'Not implemented error');
    }
    destroy() {
        throw new error_1.FatalError(error_1.ISLAND.FATAL.F0004_NOT_IMPLEMENTED_ERROR, 'Not implemented error');
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AbstractAdapter;
//# sourceMappingURL=abstract-adapter.js.map