export declare type ErrorLevelName = 'EXPECTED' | 'LOGIC' | 'FATAL' | 'ETC';
export declare enum ErrorLevel {
    EXPECTED = 1,
    LOGIC = 2,
    FATAL = 3,
    RESERVED4 = 4,
    RESERVED5 = 5,
    RESERVED6 = 6,
    RESERVED7 = 7,
    RESERVED8 = 8,
    ETC = 9,
}
export declare enum IslandLevel {
    ISLAND = 0,
    ISLANDJS = 1,
    UNKNOWN = 2,
    RESERVED3 = 3,
    RESERVED4 = 4,
    RESERVED5 = 5,
    RESERVED6 = 6,
    RESERVED7 = 7,
    RESERVED8 = 8,
    RESERVED9 = 9,
}
export declare function setIslandCode(code: number): void;
export declare function getIslandCode(): number;
export declare function toCode(errorCode: number): number;
export declare function mergeIslandJsError(errorCode: number): number;
export declare class AbstractError extends Error {
    static splitCode(code: any): {
        islandCode: number;
        islandLevel: IslandLevel;
        islandLevelName: string;
        errorCode: number;
    };
    static mergeCode(islandCode: number, islandLevel: IslandLevel, errorCode: number): number;
    static ensureUuid(extra: {
        [key: string]: any;
        uuid: string;
    }): {
        [key: string]: any;
        uuid: string;
    };
    code: number;
    reason: string;
    statusCode: number;
    stack: any;
    extra: any;
    constructor(islandCode: number, islandLevel: IslandLevel, errorCode: number, reason: string);
    split(): {
        islandCode: number;
        islandLevel: IslandLevel;
        islandLevelName: string;
        errorCode: number;
    };
}
export declare class AbstractExpectedError extends AbstractError {
    constructor(islandCode: number, islandLevel: IslandLevel, errorCode: number, reason: string);
}
export declare class AbstractLogicError extends AbstractError {
    constructor(islandCode: number, islandLevel: IslandLevel, errorCode: number, reason: string);
}
export declare class AbstractFatalError extends AbstractError {
    constructor(islandCode: number, islandLevel: IslandLevel, errorCode: number, reason: string);
}
export declare class AbstractEtcError extends AbstractError {
    constructor(islandCode: number, islandLevel: IslandLevel, errorCode: number, reason: string);
}
export declare class LogicError extends AbstractLogicError {
    constructor(errorCode: ISLAND.LOGIC, reason?: string);
}
export declare class FatalError extends AbstractFatalError {
    constructor(errorCode: ISLAND.FATAL, reason?: string);
}
export declare class ExpectedError extends AbstractExpectedError {
    constructor(errorCode: ISLAND.EXPECTED, reason?: string);
}
export declare namespace ISLAND {
    enum EXPECTED {
        E0001_UNKNOWN = 1,
    }
    enum LOGIC {
        L0001_PLAYER_NOT_EXIST = 1,
        L0002_WRONG_PARAMETER_SCHEMA = 2,
        L0003_NOT_INITIALIZED_EXCEPTION = 3,
        L0004_MSG_PACK_ERROR = 4,
        L0005_MSG_PACK_ENCODE_ERROR = 5,
        L0006_HANDLE_MESSAGE_ERROR = 6,
        L0007_PUSH_ENCODE_ERROR = 7,
    }
    enum FATAL {
        F0001_ISLET_ALREADY_HAS_BEEN_REGISTERED = 1,
        F0002_DUPLICATED_ADAPTER = 2,
        F0003_MISSING_ADAPTER = 3,
        F0004_NOT_IMPLEMENTED_ERROR = 4,
        F0008_AMQP_CHANNEL_POOL_REQUIRED = 8,
        F0011_NOT_INITIALIZED_EXCEPTION = 11,
        F0012_ROUND_ROBIN_EVENT_Q_IS_NOT_DEFINED = 12,
        F0013_NOT_INITIALIZED = 13,
        F0015_TAG_IS_UNDEFINED = 15,
        F0016_SCOPE_CONTEXT_ERROR = 16,
        F0018_ERROR_COLLECTING_META_DATA = 18,
        F0019_NOT_IMPLEMENTED_ERROR = 19,
        F0020_NOT_INITIALIZED_EXCEPTION = 20,
        F0021_NOT_IMPLEMENTED_ERROR = 21,
        F0022_NOT_INITIALIZED_EXCEPTION = 22,
        F0023_RPC_TIMEOUT = 23,
        F0024_ENDPOINT_METHOD_REDECLARED = 24,
        F0025_MISSING_ADAPTER_OPTIONS = 25,
        F0026_MISSING_REPLYTO_IN_RPC = 26,
        F0027_CONSUMER_IS_CANCELED = 27,
    }
}
