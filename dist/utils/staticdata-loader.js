"use strict";
const error_1 = require("../utils/error");
class StaticDataLoader {
    get Object() {
        if (!this.object) {
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0020_NOT_INITIALIZED_EXCEPTION, 'Exception :: This object is not initialized');
        }
        return this.object;
    }
    initialize() {
        throw new error_1.FatalError(error_1.ISLAND.FATAL.F0021_NOT_IMPLEMENTED_ERROR, 'Exception :: This object is not implemented.');
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StaticDataLoader;
//# sourceMappingURL=staticdata-loader.js.map