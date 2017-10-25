"use strict";
const error_1 = require("../utils/error");
const logger_1 = require("../utils/logger");
const schema_types_1 = require("./schema-types");
const inspector = require("schema-inspector");
function sanitize(subschema, target) {
    if (!subschema)
        return target;
    schema_types_1.default(subschema);
    const result = inspector.sanitize(subschema, target);
    logger_1.logger.debug('sanitized: %o', result.data);
    return result.data;
}
exports.sanitize = sanitize;
function validate(subschema, target) {
    if (!subschema)
        return true;
    schema_types_1.default(subschema);
    const result = inspector.validate(subschema, target);
    if (!result.valid) {
        logger_1.logger.notice(`Is result valid? ${result.valid} / ${result.format()}`);
    }
    return result.valid;
}
exports.validate = validate;
function paramSchemaInspector(req) {
    if (!req.options.schema)
        return;
    if (!req.options.schema.query)
        return;
    const schema = req.options.schema.query.validation;
    if (schema) {
        const valid = validate(schema, req.msg);
        if (!valid)
            throw new error_1.LogicError(error_1.ISLAND.LOGIC.L0002_WRONG_PARAMETER_SCHEMA, `Wrong parameter schema`);
    }
    logger_1.logger.debug(`RPC schema verified, RPC: ${req.name}`);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = paramSchemaInspector;
//# sourceMappingURL=schema.middleware.js.map