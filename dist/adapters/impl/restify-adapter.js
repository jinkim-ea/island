"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const restify = require("restify");
const error_1 = require("../../utils/error");
const listenable_adapter_1 = require("../listenable-adapter");
const restify_query_parser_1 = require("./middlewares/restify-query-parser");
/**
 * RestifyAdapter
 * @class
 * @extends ListenableAdapter
 */
class RestifyAdapter extends listenable_adapter_1.default {
    /**
     * Initialize the restify server.
     * @override
     * @returns {Promise<void>}
     */
    initialize() {
        if (!this.options)
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
        const options = this.options;
        const server = restify.createServer(options.serverOptions || {});
        // Cleans up sloppy URLs on the request object, like /foo////bar/// to /foo/bar.
        // ex) /v2/a/b/ => /v2/a/b
        server.pre(restify.pre.sanitizePath());
        server.use(restify.dateParser());
        server.use(restify_query_parser_1.default());
        server.use(restify.bodyParser({
            // https://github.com/restify/node-restify/issues/789 <-
            mapParams: false,
            // TODO: export below params to external configuation file
            maxBodySize: 0
        }));
        this._adaptee = server;
    }
    /**
     * Listen the restify server.
     * @override
     * @returns {Promise<void>}
     */
    listen() {
        return new Promise((resolve, reject) => {
            if (!this.options)
                throw new error_1.FatalError(error_1.ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
            this.adaptee.listen(this.options.port, err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
    destroy() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("destroy").call(this);
            return yield this.adaptee.close();
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RestifyAdapter;
//# sourceMappingURL=restify-adapter.js.map