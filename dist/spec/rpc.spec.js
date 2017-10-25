"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// tslint:disable-next-line
require('source-map-support').install();
process.env.ISLAND_RPC_EXEC_TIMEOUT_MS = 1000;
process.env.ISLAND_RPC_WAIT_TIMEOUT_MS = 3000;
process.env.ISLAND_SERVICE_LOAD_TIME_MS = 1000;
process.env.STATUS_EXPORT = 'true';
process.env.STATUS_EXPORT_TIME_MS = 3 * 1000;
const Bluebird = require("bluebird");
const fs = require("fs");
const schema_middleware_1 = require("../middleware/schema.middleware");
const amqp_channel_pool_service_1 = require("../services/amqp-channel-pool-service");
const rpc_service_1 = require("../services/rpc-service");
const error_1 = require("../utils/error");
const jasmine_async_support_1 = require("../utils/jasmine-async-support");
const logger_1 = require("../utils/logger");
const status_exporter_1 = require("../utils/status-exporter");
const tracelog_1 = require("../utils/tracelog");
// tslint:disable-next-line no-var-requires
const stdMocks = require('std-mocks');
function mock(func) {
    return __awaiter(this, void 0, void 0, function* () {
        stdMocks.use();
        yield func();
        const output = stdMocks.flush();
        stdMocks.restore();
        return output;
    });
}
describe('RpcResponse', () => {
    it('should handle malformed response', () => {
        const malformedJson = '{"result": true, "body": 1';
        expect(rpc_service_1.RpcResponse.decode(new Buffer(malformedJson))).toEqual({ version: 0, result: false });
    });
    it('should understand an AbstractError object', () => {
        const error = new error_1.FatalError(error_1.ISLAND.FATAL.F0001_ISLET_ALREADY_HAS_BEEN_REGISTERED);
        const json = JSON.stringify({ result: false, body: error });
        expect(rpc_service_1.RpcResponse.decode(new Buffer(json)).body).toEqual(jasmine.any(error_1.AbstractFatalError));
    });
});
describe('RPC test:', () => {
    const rpcService = new rpc_service_1.default('haha');
    const amqpChannelPool = new amqp_channel_pool_service_1.AmqpChannelPoolService();
    beforeAll(jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const url = process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672';
        yield amqpChannelPool.initialize({ url });
        yield rpcService.initialize(amqpChannelPool);
    })));
    afterAll(done => {
        rpcService.purge()
            .then(() => Bluebird.delay(100)) // to have time to send ack
            .then(() => amqpChannelPool.purge())
            .then(() => tracelog_1.TraceLog.purge())
            .then(done)
            .catch(done.fail);
    });
    it('rpc test #1: rpc call', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('testMethod', msg => {
            expect(msg).toBe('hello');
            return Promise.resolve('world');
        }, 'rpc');
        yield rpcService.listen();
        const res = yield rpcService.invoke('testMethod', 'hello');
        expect(res).toBe('world');
    })));
    it('rpc test #2: rpc call again', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const res = yield rpcService.invoke('testMethod', 'hello');
        expect(res).toBe('world');
    })));
    it('rpc test #3: purge', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.unregister('testMethod');
    })));
    it('should handle Error()', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('testMethod', msg => {
            throw new Error('custom error');
        }, 'rpc');
        yield rpcService.listen();
        try {
            yield rpcService.invoke('testMethod', 'hello');
        }
        catch (e) {
            expect(e instanceof error_1.AbstractEtcError).toBeTruthy();
            expect(e.code).toEqual(10020001);
            expect(e.name).toEqual('Error');
            expect(e.reason).toEqual('custom error');
            expect(e.extra.uuid).not.toBeFalsy();
        }
        yield rpcService.unregister('testMethod');
    })));
    it('should handle TypeError()', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('testMethod', msg => {
            const tmp = (() => undefined)();
            return tmp.xx;
        }, 'rpc');
        yield rpcService.listen();
        try {
            yield rpcService.invoke('testMethod', 'hello');
        }
        catch (e) {
            expect(e instanceof error_1.AbstractEtcError).toBeTruthy();
            expect(e.code).toEqual(10020001);
            expect(e.name).toEqual('TypeError');
            expect(e.reason).toEqual(`Cannot read property 'xx' of undefined`);
        }
        yield rpcService.unregister('testMethod');
    })));
    it('should handle third-party error()', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('testMethod', (msg) => __awaiter(this, void 0, void 0, function* () {
            yield Bluebird.delay(100).timeout(10);
            return 1;
        }), 'rpc');
        yield rpcService.listen();
        try {
            yield rpcService.invoke('testMethod', 'hello');
        }
        catch (e) {
            expect(e instanceof error_1.AbstractEtcError).toBeTruthy();
            expect(e.code).toEqual(10020001);
            expect(e.name).toEqual('TimeoutError');
            expect(e.reason).toEqual('operation timed out');
            expect(e.extra.uuid).not.toBeFalsy();
        }
        yield rpcService.unregister('testMethod');
    })));
    it('rpc test #5: should prevent to get new RPC request safely', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('testMethod', (msg) => __awaiter(this, void 0, void 0, function* () {
            yield Bluebird.delay(msg);
            return msg;
        }), 'rpc');
        yield rpcService.listen();
        const promises = [
            rpcService.invoke('testMethod', 100),
            rpcService.invoke('testMethod', 10)
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                yield rpcService.pause('testMethod');
                return res;
            }))
        ];
        const res = yield Promise.all(promises);
        expect(res[0]).toEqual(100);
        expect(res[1]).toEqual(10);
    })));
    it('should respond an ongoing request despite purging', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            rpcService.register('AAA', (msg) => __awaiter(this, void 0, void 0, function* () {
                // Note: purge 시 ongoing Rpc 가 존재 할 경우, 처리 될 때까지 대기 하기 때문에 await 을 써줄 수 없게 됨.
                rpcService.purge();
                yield Bluebird.delay(msg);
                return Promise.resolve('world');
            }), 'rpc'),
            rpcService.register('BBBB', (msg) => __awaiter(this, void 0, void 0, function* () {
                yield Bluebird.delay(msg);
                return Promise.resolve('world');
            }), 'rpc')
        ]);
        yield rpcService.listen();
        yield rpcService.invoke('AAA', 50);
    })));
    it('rpc test #7: rpc call with sanitizatioin, validation', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const sanitization = { type: 'string' };
        const validation = { type: 'string' };
        const rpcOptions = {
            schema: {
                query: { sanitization, validation },
                result: { sanitization, validation }
            }
        };
        yield rpcService.register('testSchemaMethod', msg => Promise.resolve('world'), 'rpc', rpcOptions);
        yield rpcService.listen();
        const res = yield rpcService.invoke('testSchemaMethod', 'hello');
        expect(res).toBe('world');
    })));
    it('rpc test #8: rpc call with paramSchemaInspector', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const validation = { type: 'string' };
        const rpcOptions = {
            schema: {
                query: { sanitization: {}, validation },
                result: { sanitization: {}, validation }
            }
        };
        const req = {
            msg: {},
            name: 'test',
            options: rpcOptions
        };
        expect(() => {
            schema_middleware_1.default(req);
        }).toThrowError(/.*10010002-Wrong parameter schema.*/);
    })));
    it('should unregister handlers if it failed to send a message', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const usingChannel = amqpChannelPool.usingChannel;
        amqpChannelPool.usingChannel = (cb) => __awaiter(this, void 0, void 0, function* () {
            yield cb({
                sendToQueue: (name, content, options) => { throw new Error('haha'); }
            });
        });
        try {
            yield rpcService.invoke('testMethod', 'hello');
            expect(true).toEqual(false);
        }
        catch (e) {
            expect(e.message).toEqual('haha');
        }
        expect(rpcService.waitingResponse).toEqual({});
        amqpChannelPool.usingChannel = usingChannel;
    })));
    it('should keeping a constant queue during restart the service', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('testMethod3', msg => Promise.resolve('world'), 'rpc');
        yield rpcService.listen();
        yield rpcService.purge();
        yield amqpChannelPool.purge();
        yield tracelog_1.TraceLog.purge();
        const url = process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672';
        yield amqpChannelPool.initialize({ url });
        yield rpcService.initialize(amqpChannelPool);
        const p = rpcService.invoke('testMethod3', 'hello');
        yield Bluebird.delay(parseInt(process.env.ISLAND_RPC_WAIT_TIMEOUT_MS, 10) / 2);
        yield rpcService.register('testMethod3', msg => Promise.resolve('world'), 'rpc');
        yield rpcService.listen();
        const res = yield p;
        expect(res).toBe('world');
    })));
    it('should be able to pause and resume', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('testPause', msg => Promise.resolve(msg + ' world'), 'rpc');
        yield rpcService.listen();
        yield rpcService.pause('testPause');
        const p = rpcService.invoke('testPause', 'hello');
        yield rpcService.resume('testPause');
        const res = yield p;
        expect(res).toBe('hello world');
    })));
    it('should know where the RPC error come from', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const rpcServiceSecond = new rpc_service_1.default('second-island');
        yield rpcServiceSecond.initialize(amqpChannelPool);
        const rpcServiceThird = new rpc_service_1.default('third-island');
        yield rpcServiceThird.initialize(amqpChannelPool);
        yield rpcServiceThird.register('third', msg => {
            throw new Error('custom error');
        }, 'rpc');
        yield rpcServiceThird.listen();
        yield rpcServiceSecond.register('second', (msg) => __awaiter(this, void 0, void 0, function* () {
            yield rpcServiceSecond.invoke('third', 'hello');
        }), 'rpc');
        yield rpcServiceSecond.listen();
        yield rpcService.register('first', (msg) => __awaiter(this, void 0, void 0, function* () {
            yield rpcService.invoke('second', 'hello');
        }), 'rpc');
        yield rpcService.listen();
        try {
            yield rpcServiceSecond.invoke('first', 'hello');
        }
        catch (e) {
            yield rpcServiceSecond.unregister('second');
            yield rpcServiceThird.unregister('third');
            expect(e instanceof error_1.AbstractEtcError).toBeTruthy();
            expect(e.code).toEqual(10020001);
            expect(e.name).toEqual('Error');
            expect(e.extra.island).toBe('third-island');
            expect(e.extra.rpcName).toBe('third');
        }
    })));
    it('should know where the RPC validation error come from', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const rpcServiceSecond = new rpc_service_1.default('second-island');
        yield rpcServiceSecond.initialize(amqpChannelPool);
        const rpcServiceThird = new rpc_service_1.default('third-island');
        yield rpcServiceThird.initialize(amqpChannelPool);
        const validation = { type: 'string' };
        const rpcOptions = {
            schema: {
                query: { sanitization: {}, validation },
                result: { sanitization: {}, validation }
            }
        };
        yield rpcServiceThird.register('third', msg => Promise.resolve('hello'), 'rpc', rpcOptions);
        yield rpcServiceThird.listen();
        yield rpcServiceSecond.register('second', msg => {
            return rpcServiceSecond.invoke('third', 1234);
        }, 'rpc');
        yield rpcServiceSecond.listen();
        yield rpcService.register('first', msg => {
            return rpcService.invoke('second', 'hello');
        }, 'rpc');
        yield rpcService.listen();
        try {
            const p = yield rpcServiceSecond.invoke('first', 'hello');
            console.log(p);
        }
        catch (e) {
            yield rpcServiceSecond.unregister('second');
            yield rpcServiceThird.unregister('third');
            expect(e instanceof error_1.AbstractLogicError).toBeTruthy();
            expect(e.code).toEqual(10010002); // UNKNOWN/ISLANDJS/0002/WRONG_PARAMETER_SCHEMA
            expect(e.name).toEqual('LogicError');
            expect(e.extra.island).toBe('third-island');
            expect(e.extra.rpcName).toBe('third');
        }
    })));
    it('should show an extra info of an error', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('hoho', req => {
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0001_ISLET_ALREADY_HAS_BEEN_REGISTERED);
        }, 'rpc');
        yield rpcService.listen();
        try {
            yield rpcService.invoke('hoho', 'asdf');
        }
        catch (e) {
            expect(e.extra.rpcName).toEqual('hoho');
            expect(e.extra.req).toEqual('asdf');
        }
    })));
});
describe('RPC(isolated test)', () => {
    const rpcService = new rpc_service_1.default('haha');
    const amqpChannelPool = new amqp_channel_pool_service_1.AmqpChannelPoolService();
    beforeEach(jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const url = process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672';
        yield amqpChannelPool.initialize({ url });
        yield rpcService.initialize(amqpChannelPool);
    })));
    afterEach(done => {
        rpcService.purge()
            .then(() => Bluebird.delay(100)) // to have time to send ack
            .then(() => amqpChannelPool.purge())
            .then(() => tracelog_1.TraceLog.purge())
            .then(done)
            .catch(done.fail);
    });
    it('should be canceled by timeout', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        try {
            yield rpcService.invoke('unmethod', 'arg');
            fail();
        }
        catch (e) {
            const rs = rpcService;
            expect(e instanceof error_1.AbstractFatalError).toBeTruthy();
            expect(e.code).toEqual(10010023); // UNKNOWN/ISLANDJS/0023/RPC_TIMEOUT
            expect(e.extra.uuid).not.toBeFalsy();
            expect(rs.timedOutOrdered.length).toEqual(1);
            expect(rs.timedOut[rs.timedOutOrdered[0]]).toEqual('unmethod');
        }
    })));
    it('should ensure the uuid of the error raised by the RPC which has been timed out', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('out', () => {
            return rpcService.invoke('unmethod', 'arg');
        }, 'rpc');
        yield rpcService.listen();
        try {
            yield rpcService.invoke('out', 'abc');
            fail();
        }
        catch (e) {
            expect(e.extra.uuid).not.toBeFalsy();
        }
    })));
    it('should retry when it comes with 503 status code', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        let called = 0;
        yield rpcService.register('testMethod', msg => {
            called++;
            const e = new Error('custom error');
            e.statusCode = 503;
            throw e;
        }, 'rpc');
        yield rpcService.listen();
        yield rpcService.invoke('testMethod', 'hello').catch(e => e);
        expect(called).toBeGreaterThanOrEqual(2);
    })));
    it('should also return a raw buffer with an option', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield rpcService.register('testMethod', () => __awaiter(this, void 0, void 0, function* () {
            return 'haha';
        }), 'rpc');
        yield rpcService.listen();
        const res = yield rpcService.invoke('testMethod', 'hello', { withRawdata: true });
        expect(res.body).toEqual('haha');
        expect(res.raw).toEqual(jasmine.any(Buffer));
    })));
    it('should deprecate RPCService#_publish', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const output = yield mock(() => __awaiter(this, void 0, void 0, function* () {
            yield rpcService._publish('xexchange', 'xroutingKey', new Buffer('3'));
        }));
        expect(output.stderr[0].split('\n')[0]).toEqual('Method `_publish` has been deprecated.');
    })));
    it('should shutdown when the response consumer is canceled', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const rs = rpcService;
        const queue = rs.responseQueueName;
        spyOn(rs, 'shutdown');
        spyOn(logger_1.logger, 'crit');
        yield amqpChannelPool.usingChannel((chan) => __awaiter(this, void 0, void 0, function* () { return chan.deleteQueue(queue); }));
        yield Bluebird.delay(10);
        expect(logger_1.logger.crit)
            .toHaveBeenCalledWith('The consumer is canceled, will lose following responses - https://goo.gl/HIgy4D');
        expect(rs.shutdown).toHaveBeenCalled();
    })));
    it('should handle a reponse with no correlationId', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const queue = rpcService.responseQueueName;
        spyOn(logger_1.logger, 'notice');
        yield amqpChannelPool.usingChannel((chan) => __awaiter(this, void 0, void 0, function* () { return chan.sendToQueue(queue, new Buffer('')); }));
        yield Bluebird.delay(10);
        expect(logger_1.logger.notice).toHaveBeenCalledWith('Got a response with no correlationId');
    })));
    it('should handle a response after timed out', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const rs = rpcService;
        rs.timedOut.aaaa = 'unmethod';
        rs.timedOutOrdered.push('aaaa');
        const queue = rs.responseQueueName;
        spyOn(logger_1.logger, 'warning');
        yield amqpChannelPool.usingChannel((chan) => __awaiter(this, void 0, void 0, function* () { return chan.sendToQueue(queue, new Buffer(''), { correlationId: 'aaaa' }); }));
        yield Bluebird.delay(10);
        expect(logger_1.logger.warning).toHaveBeenCalledWith('Got a response of `unmethod` after timed out - aaaa');
        expect(rs.timedOutOrdered.length).toEqual(0);
        expect(rs.timedOut).toEqual({});
    })));
    it('should handle an unknown reponse', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const rs = rpcService;
        const queue = rs.responseQueueName;
        spyOn(logger_1.logger, 'notice');
        yield amqpChannelPool.usingChannel((chan) => __awaiter(this, void 0, void 0, function* () { return chan.sendToQueue(queue, new Buffer(''), { correlationId: 'aaaa' }); }));
        yield Bluebird.delay(50);
        expect(logger_1.logger.notice).toHaveBeenCalledWith('Got an unknown response - aaaa');
    })));
    it('should keep original uuid through the RPCs', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        let uuid;
        yield rpcService.register('in', () => {
            const e = new error_1.FatalError(error_1.ISLAND.FATAL.F0001_ISLET_ALREADY_HAS_BEEN_REGISTERED);
            uuid = e.extra.uuid;
            throw e;
        }, 'rpc');
        yield rpcService.register('out', () => rpcService.invoke('in', 'a'), 'rpc');
        yield rpcService.listen();
        try {
            yield rpcService.invoke('out', 'b');
        }
        catch (e) {
            expect(e.extra.uuid).toEqual(uuid);
        }
    })));
});
describe('RPC with reviver', () => __awaiter(this, void 0, void 0, function* () {
    const url = process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672';
    const rpcService = new rpc_service_1.default('haha');
    const amqpChannelPool = new amqp_channel_pool_service_1.AmqpChannelPoolService();
    function invokeTest(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            yield rpcService.initialize(amqpChannelPool, opts);
            yield rpcService.register('testMethod', msg => Promise.resolve(new Date().toISOString()), 'rpc');
            yield rpcService.listen();
            return yield rpcService.invoke('testMethod', 'hello');
        });
    }
    beforeEach(jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield amqpChannelPool.initialize({ url });
    })));
    afterEach(jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield Bluebird.delay(100);
        yield tracelog_1.TraceLog.purge();
        yield rpcService.purge();
        yield amqpChannelPool.purge();
    })));
    it('should convert an ISODate string to Date', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const res = yield invokeTest();
        expect(typeof res).toEqual('object');
        expect(res instanceof Date).toBeTruthy();
    })));
    it('should keep an ISODate string as string with noReviver', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const res = yield invokeTest({ noReviver: true });
        expect(typeof res).toEqual('string');
        expect(res instanceof Date).toBeFalsy();
    })));
}));
describe('RPC-hook', () => {
    const url = process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672';
    const rpcService = new rpc_service_1.default('haha');
    const amqpChannelPool = new amqp_channel_pool_service_1.AmqpChannelPoolService();
    beforeEach(jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield amqpChannelPool.initialize({ url });
        yield rpcService.initialize(amqpChannelPool);
    })));
    afterEach(jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield Bluebird.delay(100);
        yield tracelog_1.TraceLog.purge();
        yield rpcService.purge();
        yield amqpChannelPool.purge();
    })));
    it('could change the request body by pre-hook', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        rpcService.registerHook(rpc_service_1.RpcHookType.PRE_RPC, content => Promise.resolve('hi, ' + content));
        yield rpcService.register('testMethod', msg => Promise.resolve(msg + ' world'), 'rpc');
        yield rpcService.listen();
        const res = yield rpcService.invoke('testMethod', 'hello');
        expect(res).toEqual('hi, hello world');
    })));
    it('could change the response body by post-hook', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        rpcService.registerHook(rpc_service_1.RpcHookType.POST_RPC, content => {
            content.__fixed = true;
            return Promise.resolve(content);
        });
        yield rpcService.register('testMethod', msg => Promise.resolve({ [msg]: 'world' }), 'rpc');
        yield rpcService.listen();
        const res = yield rpcService.invoke('testMethod', 'hello');
        expect(res).toEqual({ __fixed: true, hello: 'world' });
    })));
    it('could add multiple pre-hooks', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        rpcService.registerHook(rpc_service_1.RpcHookType.PRE_RPC, content => Promise.resolve('hi, ' + content));
        rpcService.registerHook(rpc_service_1.RpcHookType.PRE_RPC, content => Promise.resolve('hey, ' + content));
        yield rpcService.register('testMethod', msg => Promise.resolve(msg + ' world'), 'rpc');
        yield rpcService.listen();
        const res = yield rpcService.invoke('testMethod', 'hello');
        expect(res).toEqual('hey, hi, hello world');
    })));
    it('could add multiple post-hooks', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        rpcService.registerHook(rpc_service_1.RpcHookType.POST_RPC, content => Promise.resolve({ first: content }));
        rpcService.registerHook(rpc_service_1.RpcHookType.POST_RPC, content => Promise.resolve({ second: content }));
        yield rpcService.register('testMethod', msg => Promise.resolve({ [msg]: 'world' }), 'rpc');
        yield rpcService.listen();
        const res = yield rpcService.invoke('testMethod', 'hello');
        expect(res).toEqual({ second: { first: { hello: 'world' } } });
    })));
    it('should share the hooks with every RPCs', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        rpcService.registerHook(rpc_service_1.RpcHookType.PRE_RPC, content => Promise.resolve('hi-' + content));
        rpcService.registerHook(rpc_service_1.RpcHookType.PRE_RPC, content => Promise.resolve('hey-' + content));
        rpcService.registerHook(rpc_service_1.RpcHookType.POST_RPC, content => Promise.resolve({ first: content }));
        rpcService.registerHook(rpc_service_1.RpcHookType.POST_RPC, content => Promise.resolve({ second: content }));
        yield rpcService.register('world', msg => Promise.resolve({ [msg]: 'world' }), 'rpc');
        yield rpcService.register('hell', msg => Promise.resolve({ [msg]: 'hell' }), 'rpc');
        yield rpcService.listen();
        expect(yield rpcService.invoke('world', 'hello'))
            .toEqual({ second: { first: { 'hey-hi-hello': 'world' } } });
        expect(yield rpcService.invoke('hell', 'damn'))
            .toEqual({ second: { first: { 'hey-hi-damn': 'hell' } } });
    })));
    it('could change the error object before respond', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        rpcService.registerHook(rpc_service_1.RpcHookType.PRE_RPC_ERROR, e => {
            e.extra = e.extra || {};
            e.extra.message = 'pre-hooked';
            return Promise.resolve(e);
        });
        yield rpcService.register('world', msg => Promise.reject(new Error('custom error')), 'rpc');
        yield rpcService.listen();
        try {
            yield rpcService.invoke('world', 'hello');
            expect(true).toEqual(false);
        }
        catch (e) {
            expect(e.message).toMatch(/custom error/);
            expect(e.extra.message).toEqual('pre-hooked');
        }
    })));
    it('could not change the error object with POST_RPC_ERROR', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        let haveBeenCalled = false;
        rpcService.registerHook(rpc_service_1.RpcHookType.PRE_RPC_ERROR, e => {
            e.extra = e.extra || {};
            e.extra.message = 'pre-hooked';
            return Promise.resolve(e);
        });
        rpcService.registerHook(rpc_service_1.RpcHookType.POST_RPC_ERROR, e => {
            e.extra = e.extra || {};
            e.extra.message = 'post-hooked';
            haveBeenCalled = true;
            return Promise.resolve(e);
        });
        yield rpcService.register('world', msg => Promise.reject(new Error('custom error')), 'rpc');
        yield rpcService.listen();
        try {
            yield rpcService.invoke('world', 'hello');
            expect(true).toEqual(false);
        }
        catch (e) {
            yield Bluebird.delay(1);
            expect(e.extra.message).toEqual('pre-hooked');
            expect(haveBeenCalled).toBeTruthy();
        }
    })));
    it('should specify filename and instanceId', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        const fileName = status_exporter_1.exporter.initialize({ name: 'rpc', hostname: 'test' });
        yield status_exporter_1.exporter.saveStatusJsonFile();
        const file = yield fs.readFileSync(fileName, 'utf8');
        const json = JSON.parse(file);
        yield fs.unlinkSync(fileName);
        expect(json.instanceId).toBeDefined('test');
    })));
});
//# sourceMappingURL=rpc.spec.js.map