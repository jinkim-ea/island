"use strict";
const error_1 = require("../utils/error");
const rpc_response_1 = require("../utils/rpc-response");
describe('Error', () => {
    afterEach(() => {
        error_1.setIslandCode(100);
    });
    it('should identify island code', () => {
        error_1.setIslandCode(101);
        const logic = new error_1.LogicError(error_1.ISLAND.LOGIC.L0001_PLAYER_NOT_EXIST);
        expect(logic.code).toEqual(10110001);
        error_1.setIslandCode(111);
        const fatal = new error_1.FatalError(error_1.ISLAND.FATAL.F0001_ISLET_ALREADY_HAS_BEEN_REGISTERED);
        expect(fatal.code).toEqual(11110001);
        error_1.setIslandCode(999);
        const expected = new error_1.ExpectedError(error_1.ISLAND.EXPECTED.E0001_UNKNOWN);
        expect(expected.code).toEqual(99910001);
    });
    it('should identify island level', () => {
        class IslandLogicError extends error_1.AbstractLogicError {
            constructor(errorCode) {
                super(100, 0, errorCode, '');
            }
        }
        const logic = new IslandLogicError(1);
        expect(logic.code).toEqual(10000001);
    });
    it('should have an unique id', () => {
        const e = new error_1.LogicError(error_1.ISLAND.LOGIC.L0001_PLAYER_NOT_EXIST);
        expect(e.extra.uuid.split('-').length).toEqual(5);
    });
    it('should split code of an AbstractError', () => {
        error_1.setIslandCode(101);
        const e = new error_1.LogicError(error_1.ISLAND.LOGIC.L0001_PLAYER_NOT_EXIST);
        const raw = e.split();
        expect(raw.islandCode).toEqual(101);
        expect(raw.islandLevel).toEqual(error_1.IslandLevel.ISLANDJS);
        expect(raw.islandLevelName).toEqual('ISLANDJS');
        expect(raw.errorCode).toEqual(error_1.ISLAND.LOGIC.L0001_PLAYER_NOT_EXIST);
        /* {
          islandCode:  101,
          islandLevel: 1, islandLevelName: 'ISLANDJS',
          errorCode:   1
        } */
    });
    it('should merge numbers into a code', () => {
        const code = error_1.AbstractError.mergeCode(101, error_1.IslandLevel.ISLANDJS, error_1.ISLAND.LOGIC.L0001_PLAYER_NOT_EXIST);
        expect(code).toEqual(10110001);
    });
});
describe('Error decode', () => {
    afterEach(() => {
        error_1.setIslandCode(100);
    });
    it('encode-decode', () => {
        {
            const error = new error_1.LogicError(error_1.ISLAND.LOGIC.L0001_PLAYER_NOT_EXIST);
            const decoded = rpc_response_1.RpcResponse.decode(rpc_response_1.RpcResponse.encode(error));
            expect(decoded.body instanceof error_1.AbstractLogicError).toBeTruthy();
            expect(decoded.body.code).toEqual(error.code);
        }
        {
            error_1.setIslandCode(101);
            const error = new error_1.FatalError(error_1.ISLAND.FATAL.F0001_ISLET_ALREADY_HAS_BEEN_REGISTERED);
            const encoded = rpc_response_1.RpcResponse.encode(error);
            error_1.setIslandCode(100);
            const decoded = rpc_response_1.RpcResponse.decode(encoded);
            expect(decoded.body instanceof error_1.AbstractFatalError).toBeTruthy();
            expect(decoded.body.code).toEqual(error.code);
        }
    });
});
//# sourceMappingURL=error.spec.js.map