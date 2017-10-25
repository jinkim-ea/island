"use strict";
const qs = require("qs");
function queryParser() {
    return (req, res, next) => {
        if (!req.getQuery()) {
            req.query = {};
            return next();
        }
        req.query = qs.parse(req.getQuery(), { allowDots: true });
        return next();
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = queryParser;
//# sourceMappingURL=restify-query-parser.js.map