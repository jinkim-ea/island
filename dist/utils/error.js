"use strict";
const assert = require("assert");
const _ = require("lodash");
const uuid = require("uuid");
var ErrorLevel;
(function (ErrorLevel) {
    ErrorLevel[ErrorLevel["EXPECTED"] = 1] = "EXPECTED";
    ErrorLevel[ErrorLevel["LOGIC"] = 2] = "LOGIC";
    ErrorLevel[ErrorLevel["FATAL"] = 3] = "FATAL";
    ErrorLevel[ErrorLevel["RESERVED4"] = 4] = "RESERVED4";
    ErrorLevel[ErrorLevel["RESERVED5"] = 5] = "RESERVED5";
    ErrorLevel[ErrorLevel["RESERVED6"] = 6] = "RESERVED6";
    ErrorLevel[ErrorLevel["RESERVED7"] = 7] = "RESERVED7";
    ErrorLevel[ErrorLevel["RESERVED8"] = 8] = "RESERVED8";
    ErrorLevel[ErrorLevel["ETC"] = 9] = "ETC";
})(ErrorLevel = exports.ErrorLevel || (exports.ErrorLevel = {}));
var IslandLevel;
(function (IslandLevel) {
    IslandLevel[IslandLevel["ISLAND"] = 0] = "ISLAND";
    IslandLevel[IslandLevel["ISLANDJS"] = 1] = "ISLANDJS";
    IslandLevel[IslandLevel["UNKNOWN"] = 2] = "UNKNOWN";
    IslandLevel[IslandLevel["RESERVED3"] = 3] = "RESERVED3";
    IslandLevel[IslandLevel["RESERVED4"] = 4] = "RESERVED4";
    IslandLevel[IslandLevel["RESERVED5"] = 5] = "RESERVED5";
    IslandLevel[IslandLevel["RESERVED6"] = 6] = "RESERVED6";
    IslandLevel[IslandLevel["RESERVED7"] = 7] = "RESERVED7";
    IslandLevel[IslandLevel["RESERVED8"] = 8] = "RESERVED8";
    IslandLevel[IslandLevel["RESERVED9"] = 9] = "RESERVED9";
})(IslandLevel = exports.IslandLevel || (exports.IslandLevel = {}));
function mergeCode(islandCode, islandLevel, errorCode) {
    return islandCode * 100000 +
        islandLevel * 10000 +
        errorCode;
}
let islandCode = 100; // UNKNOWN_ISLAND by convention
function setIslandCode(code) {
    assert(100 <= code);
    assert(code < 1000);
    islandCode = code;
}
exports.setIslandCode = setIslandCode;
function getIslandCode() {
    return islandCode;
}
exports.getIslandCode = getIslandCode;
function toCode(errorCode) {
    return mergeCode(islandCode, IslandLevel.ISLAND, errorCode);
}
exports.toCode = toCode;
function mergeIslandJsError(errorCode) {
    return mergeCode(islandCode, IslandLevel.ISLANDJS, errorCode);
}
exports.mergeIslandJsError = mergeIslandJsError;
/*
  1 0 1 0 0 0 0 1
  _____ _ _______
  |     | \_ errorCode
  |     \_ islandLevel
  \_ islandCode
*/
class AbstractError extends Error {
    static splitCode(code) {
        const islandCode = Math.floor(code / 100000) % 1000;
        const islandLevel = Math.floor(code / 10000) % 10;
        const errorCode = code % 10000;
        return {
            islandCode,
            islandLevel,
            islandLevelName: IslandLevel[islandLevel],
            errorCode
        };
    }
    static mergeCode(islandCode, islandLevel, errorCode) {
        return mergeCode(islandCode, islandLevel, errorCode);
    }
    static ensureUuid(extra) {
        if (extra.uuid)
            return extra;
        return _.merge({}, extra, { uuid: uuid.v4() });
    }
    constructor(islandCode, islandLevel, errorCode, reason) {
        const code = mergeCode(islandCode, islandLevel, errorCode);
        super(`${code}-${reason}`);
        this.code = code;
        this.reason = reason;
        this.extra = { uuid: uuid.v4() };
    }
    split() {
        return AbstractError.splitCode(this.code);
    }
}
exports.AbstractError = AbstractError;
class AbstractExpectedError extends AbstractError {
    constructor(islandCode, islandLevel, errorCode, reason) {
        super(islandCode, islandLevel, errorCode, reason);
        this.name = 'ExpectedError';
    }
}
exports.AbstractExpectedError = AbstractExpectedError;
class AbstractLogicError extends AbstractError {
    constructor(islandCode, islandLevel, errorCode, reason) {
        super(islandCode, islandLevel, errorCode, reason);
        this.name = 'LogicError';
    }
}
exports.AbstractLogicError = AbstractLogicError;
class AbstractFatalError extends AbstractError {
    constructor(islandCode, islandLevel, errorCode, reason) {
        super(islandCode, islandLevel, errorCode, reason);
        this.name = 'FatalError';
    }
}
exports.AbstractFatalError = AbstractFatalError;
class AbstractEtcError extends AbstractError {
    constructor(islandCode, islandLevel, errorCode, reason) {
        super(islandCode, islandLevel, errorCode, reason);
        this.name = 'EtcError';
    }
}
exports.AbstractEtcError = AbstractEtcError;
class LogicError extends AbstractLogicError {
    constructor(errorCode, reason) {
        super(islandCode, IslandLevel.ISLANDJS, errorCode, reason || '');
    }
}
exports.LogicError = LogicError;
class FatalError extends AbstractFatalError {
    constructor(errorCode, reason) {
        super(islandCode, IslandLevel.ISLANDJS, errorCode, reason || '');
    }
}
exports.FatalError = FatalError;
class ExpectedError extends AbstractExpectedError {
    constructor(errorCode, reason) {
        super(islandCode, IslandLevel.ISLANDJS, errorCode, reason || '');
    }
}
exports.ExpectedError = ExpectedError;
var ISLAND;
(function (ISLAND) {
    var EXPECTED;
    (function (EXPECTED) {
        EXPECTED[EXPECTED["E0001_UNKNOWN"] = 1] = "E0001_UNKNOWN";
    })(EXPECTED = ISLAND.EXPECTED || (ISLAND.EXPECTED = {}));
    var LOGIC;
    (function (LOGIC) {
        LOGIC[LOGIC["L0001_PLAYER_NOT_EXIST"] = 1] = "L0001_PLAYER_NOT_EXIST";
        LOGIC[LOGIC["L0002_WRONG_PARAMETER_SCHEMA"] = 2] = "L0002_WRONG_PARAMETER_SCHEMA";
        LOGIC[LOGIC["L0003_NOT_INITIALIZED_EXCEPTION"] = 3] = "L0003_NOT_INITIALIZED_EXCEPTION";
        LOGIC[LOGIC["L0004_MSG_PACK_ERROR"] = 4] = "L0004_MSG_PACK_ERROR";
        LOGIC[LOGIC["L0005_MSG_PACK_ENCODE_ERROR"] = 5] = "L0005_MSG_PACK_ENCODE_ERROR";
        LOGIC[LOGIC["L0006_HANDLE_MESSAGE_ERROR"] = 6] = "L0006_HANDLE_MESSAGE_ERROR";
        LOGIC[LOGIC["L0007_PUSH_ENCODE_ERROR"] = 7] = "L0007_PUSH_ENCODE_ERROR";
    })(LOGIC = ISLAND.LOGIC || (ISLAND.LOGIC = {}));
    var FATAL;
    (function (FATAL) {
        FATAL[FATAL["F0001_ISLET_ALREADY_HAS_BEEN_REGISTERED"] = 1] = "F0001_ISLET_ALREADY_HAS_BEEN_REGISTERED";
        FATAL[FATAL["F0002_DUPLICATED_ADAPTER"] = 2] = "F0002_DUPLICATED_ADAPTER";
        FATAL[FATAL["F0003_MISSING_ADAPTER"] = 3] = "F0003_MISSING_ADAPTER";
        FATAL[FATAL["F0004_NOT_IMPLEMENTED_ERROR"] = 4] = "F0004_NOT_IMPLEMENTED_ERROR";
        FATAL[FATAL["F0008_AMQP_CHANNEL_POOL_REQUIRED"] = 8] = "F0008_AMQP_CHANNEL_POOL_REQUIRED";
        FATAL[FATAL["F0011_NOT_INITIALIZED_EXCEPTION"] = 11] = "F0011_NOT_INITIALIZED_EXCEPTION";
        FATAL[FATAL["F0012_ROUND_ROBIN_EVENT_Q_IS_NOT_DEFINED"] = 12] = "F0012_ROUND_ROBIN_EVENT_Q_IS_NOT_DEFINED";
        FATAL[FATAL["F0013_NOT_INITIALIZED"] = 13] = "F0013_NOT_INITIALIZED";
        FATAL[FATAL["F0015_TAG_IS_UNDEFINED"] = 15] = "F0015_TAG_IS_UNDEFINED";
        FATAL[FATAL["F0016_SCOPE_CONTEXT_ERROR"] = 16] = "F0016_SCOPE_CONTEXT_ERROR";
        FATAL[FATAL["F0018_ERROR_COLLECTING_META_DATA"] = 18] = "F0018_ERROR_COLLECTING_META_DATA";
        FATAL[FATAL["F0019_NOT_IMPLEMENTED_ERROR"] = 19] = "F0019_NOT_IMPLEMENTED_ERROR";
        FATAL[FATAL["F0020_NOT_INITIALIZED_EXCEPTION"] = 20] = "F0020_NOT_INITIALIZED_EXCEPTION";
        FATAL[FATAL["F0021_NOT_IMPLEMENTED_ERROR"] = 21] = "F0021_NOT_IMPLEMENTED_ERROR";
        FATAL[FATAL["F0022_NOT_INITIALIZED_EXCEPTION"] = 22] = "F0022_NOT_INITIALIZED_EXCEPTION";
        FATAL[FATAL["F0023_RPC_TIMEOUT"] = 23] = "F0023_RPC_TIMEOUT";
        FATAL[FATAL["F0024_ENDPOINT_METHOD_REDECLARED"] = 24] = "F0024_ENDPOINT_METHOD_REDECLARED";
        FATAL[FATAL["F0025_MISSING_ADAPTER_OPTIONS"] = 25] = "F0025_MISSING_ADAPTER_OPTIONS";
        FATAL[FATAL["F0026_MISSING_REPLYTO_IN_RPC"] = 26] = "F0026_MISSING_REPLYTO_IN_RPC";
        FATAL[FATAL["F0027_CONSUMER_IS_CANCELED"] = 27] = "F0027_CONSUMER_IS_CANCELED";
    })(FATAL = ISLAND.FATAL || (ISLAND.FATAL = {}));
})(ISLAND = exports.ISLAND || (exports.ISLAND = {}));
//# sourceMappingURL=error.js.map