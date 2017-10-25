"use strict";
const io = require("socket.io");
const error_1 = require("../../utils/error");
const listenable_adapter_1 = require("../listenable-adapter");
class SocketIOAdapter extends listenable_adapter_1.default {
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize() {
        this._adaptee = io({ transports: ['websocket', 'polling', 'flashsocket'] });
        return Promise.resolve();
    }
    /**
     * @override
     * @returns {Promise<void>}
     */
    listen() {
        if (!this.options)
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
        this.adaptee.listen(this.options.port);
        return Promise.resolve();
    }
    destroy() {
        return super.destroy();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SocketIOAdapter;
//# sourceMappingURL=socketio-adapter.js.map