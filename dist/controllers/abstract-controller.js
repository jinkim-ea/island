"use strict";
/**
 * AbstractController<T>
 * @abstract
 * @class
 */
class AbstractController {
    /**
     * Connect your own controller here.
     * @constructs
     * @param {T} server
     */
    constructor(server) {
        this._server = server;
    }
    /**
     * @returns {T}
     */
    get server() { return this._server; }
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    initialize() { }
    onInitialized() { }
    destroy() { }
    onDestroy() { }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AbstractController;
//# sourceMappingURL=abstract-controller.js.map