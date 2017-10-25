"use strict";
const error_1 = require("../utils/error");
const logger_1 = require("../utils/logger");
const reviver_1 = require("../utils/reviver");
function replacer(k, v) {
    if (v instanceof error_1.AbstractError) {
        return {
            name: v.name,
            message: v.message,
            code: v.code,
            reason: v.reason,
            statusCode: v.statusCode,
            stack: v.stack,
            extra: v.extra
        };
    }
    else if (v instanceof Error) {
        const e = new error_1.AbstractEtcError(error_1.getIslandCode(), error_1.IslandLevel.UNKNOWN, 0, v.message);
        e.extra = v.extra || e.extra;
        return {
            name: v.name,
            message: e.message,
            code: e.code,
            reason: e.reason,
            stack: e.stack,
            extra: e.extra
        };
    }
    return v;
}
class RpcResponse {
    static encode(body) {
        const res = {
            body,
            result: body instanceof Error ? false : true,
            version: 1
        };
        return new Buffer(JSON.stringify(res, replacer), 'utf8');
    }
    static decode(msg) {
        try {
            const res = JSON.parse(msg.toString('utf8'), RpcResponse.reviver);
            if (!res.result)
                res.body = this.getAbstractError(res.body);
            return res;
        }
        catch (e) {
            logger_1.logger.notice('[decode error]', e);
            return { version: 0, result: false };
        }
    }
    static getAbstractError(err) {
        let result;
        const { islandCode, islandLevel, errorCode } = error_1.AbstractError.splitCode(err.code);
        switch (err.name) {
            case 'ExpectedError':
                result = new error_1.AbstractExpectedError(islandCode, islandLevel, errorCode, err.reason);
                break;
            case 'LogicError':
                result = new error_1.AbstractLogicError(islandCode, islandLevel, errorCode, err.reason);
                break;
            case 'FatalError':
                result = new error_1.AbstractFatalError(islandCode, islandLevel, errorCode, err.reason);
                break;
            default:
                result = new error_1.AbstractEtcError(islandCode, islandLevel, 1, err.reason);
                result.name = err.name;
        }
        if (err.statusCode) {
            result.statusCode = err.statusCode;
        }
        result.stack = err.stack;
        result.extra = err.extra;
        return result;
    }
}
RpcResponse.reviver = reviver_1.default;
exports.RpcResponse = RpcResponse;
//# sourceMappingURL=rpc-response.js.map