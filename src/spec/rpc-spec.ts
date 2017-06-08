// tslint:disable-next-line
require('source-map-support').install();
process.env.ISLAND_RPC_WAIT_TIMEOUT_MS = 3000;
process.env.ISLAND_SERVICE_LOAD_TIME_MS = 1000;

import Bluebird = require('bluebird');

import { RpcOptions } from '../controllers/rpc-decorator';
import paramSchemaInspector from '../middleware/schema.middleware';
import { AmqpChannelPoolService } from '../services/amqp-channel-pool-service';
import RPCService, { RpcHookType, RpcRequest } from '../services/rpc-service';
import { jasmineAsyncAdapter as spec } from '../utils/jasmine-async-support';
import { TraceLog } from '../utils/tracelog';

describe('RPC test:', () => {
  const rpcService = new RPCService('haha');
  const amqpChannelPool = new AmqpChannelPoolService();
  beforeAll(spec(async () => {
    const url = process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672';
    await amqpChannelPool.initialize({ url });
    await rpcService.initialize(amqpChannelPool);
  }));

  afterAll(done => {
    rpcService.purge()
      .then(() => Bluebird.delay(100)) // to have time to send ack
      .then(() => amqpChannelPool.purge())
      .then(() => TraceLog.purge())
      .then(done)
      .catch(done.fail);
  });

  it('rpc test #1: rpc call', spec(async () => {
    await rpcService.register('testMethod', msg => {
      expect(msg).toBe('hello');
      return Promise.resolve('world');
    }, 'rpc');
    const res = await rpcService.invoke<string, string>('testMethod', 'hello');
    expect(res).toBe('world');
  }));

  it('rpc test #2: rpc call again', spec(async () => {
    const res = await rpcService.invoke<string, string>('testMethod', 'hello');
    expect(res).toBe('world');
  }));

  it('rpc test #3: purge', spec(async () => {
    await rpcService.unregister('testMethod');
  }));

  it('rpc test #4: reject test', spec(async ()  => {
    await rpcService.register('testMethod', msg => {
      throw new Error('custom error');
    }, 'rpc');
    try {
      await rpcService.invoke<string, string>('testMethod', 'hello');
    } catch (e) {
      expect(e.message).toBe(`code: haha.ETC.F0001, msg: custom error'`);
    }
    await rpcService.unregister('testMethod');
  }));

  it('rpc test #5: should prevent to get new RPC request safely', spec(async () => {
    await rpcService.register('testMethod', async msg => {
      await Bluebird.delay(msg);
      return msg;
    }, 'rpc');
    const promises = [
      rpcService.invoke('testMethod', 100),
      rpcService.invoke('testMethod', 10)
        .then(async res => {
          await rpcService.pause('testMethod');
          return res;
        })
    ];
    const res = await Promise.all(promises);
    expect(res[0]).toEqual(100);
    expect(res[1]).toEqual(10);
  }));

  it('rpc test #6: 등록해두고 모조리 다 취소시키기', spec(async () => {
    await Promise.all([
      rpcService.register('AAA', async msg => {
        // Note: purge 시 ongoing Rpc 가 존재 할 경우, 처리 될 때까지 대기 하기 때문에 await 을 써줄 수 없게 됨.
        rpcService.purge();
        await Bluebird.delay(msg);
        return Promise.resolve('world');
      }, 'rpc'),
      rpcService.register('BBBB', async msg => {
        await Bluebird.delay(msg);
        return Promise.resolve('world');
      }, 'rpc')
    ]);
    await rpcService.invoke('AAA', 500);
  }));

  it('rpc test #7: rpc call with sanitizatioin, validation', spec(async () => {
    const sanitization  = { type: 'string' };
    const validation    = { type: 'string' };
    const rpcOptions: RpcOptions = {
      schema: {
        query:  { sanitization, validation },
        result: { sanitization, validation }
      }
    };
    await rpcService.register('testSchemaMethod', msg => Promise.resolve('world'), 'rpc', rpcOptions);
    const res = await rpcService.invoke<string, string>('testSchemaMethod', 'hello');
    expect(res).toBe('world');
  }));

  it('rpc test #8: rpc call with paramSchemaInspector', spec(async () => {
    const validation = { type: 'string' };
    const rpcOptions: RpcOptions = {
      schema: {
        query: { sanitization: {}, validation },
        result: { sanitization: {}, validation }
      }
    };
    const req: RpcRequest = {
      msg: {},
      name: 'test',
      options: rpcOptions
    };

    expect(() => {
      paramSchemaInspector(req);
    }).toThrowError(/.*L0002_WRONG_PARAMETER_SCHEMA.*/);
  }));

  it('should unregister handlers if it failed to send a message', spec(async () => {
    const usingChannel = amqpChannelPool.usingChannel;
    (amqpChannelPool as any).usingChannel = async cb => {
      await cb({
        sendToQueue: (name, content, options) => { throw new Error('haha'); }
      });
    };

    try {
      await rpcService.invoke<string, string>('testMethod', 'hello');
      expect(true).toEqual(false);
    } catch (e) {
      expect(e.message).toEqual('haha');
    }
    expect((rpcService as any).waitingRequests).toEqual({});
    amqpChannelPool.usingChannel = usingChannel;
  }));

  it('should keeping a constant queue during restart the service', spec(async () => {
    await rpcService.register('testMethod3', msg => Promise.resolve('world'), 'rpc');
    await rpcService.purge();
    await amqpChannelPool.purge();
    await TraceLog.purge();

    const url = process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672';
    await amqpChannelPool.initialize({ url });
    await rpcService.initialize(amqpChannelPool);
    const p = rpcService.invoke<string, string>('testMethod3', 'hello');
    await Bluebird.delay(parseInt(process.env.ISLAND_RPC_WAIT_TIMEOUT_MS, 10) / 2);
    await rpcService.register('testMethod3', msg => Promise.resolve('world'), 'rpc');
    const res = await p;
    expect(res).toBe('world');
  }));

  it('should be able to pause and resume', spec(async () => {
    await rpcService.register('testPause', msg => Promise.resolve(msg + ' world'), 'rpc');
    await rpcService.pause('testPause');

    const p = rpcService.invoke<string, string>('testPause', 'hello');
    await rpcService.resume('testPause');
    const res = await p;
    expect(res).toBe('hello world');
  }));
  it('should know where the rpc error occurred', spec(async () => {
    const rpcServiceSecond = new RPCService('second');
    await rpcServiceSecond.initialize(amqpChannelPool);
    const rpcServiceThird = new RPCService('third');
    await rpcServiceThird.initialize(amqpChannelPool);

    await rpcServiceThird.register('third', msg => {
      throw new Error('custom error');
    }, 'rpc');
    await rpcServiceSecond.register('second', async msg => {
      await rpcServiceSecond.invoke<string, string>('third', 'hello');
    }, 'rpc');
    await rpcService.register('first', async msg => {
      await rpcService.invoke<string, string>('second', 'hello');
    }, 'rpc');
    try {
      await rpcServiceSecond.invoke<string, string>('first', 'hello');
    } catch (e) {
      await rpcServiceSecond.unregister('second');
      await rpcServiceThird.unregister('third');
      expect(e.errorCode).toBe('third.ETC.F0001');
    }
  }));

  it('should confirm error occurred', spec(async () => {
    const rpcServiceSecond = new RPCService('second');
    await rpcServiceSecond.initialize(amqpChannelPool);
    const rpcServiceThird = new RPCService('third');
    await rpcServiceThird.initialize(amqpChannelPool);
    const validation = { type: 'string' };
    const rpcOptions: RpcOptions = {
      schema: {
        query: { sanitization: {}, validation },
        result: { sanitization: {}, validation }
      }
    };

    await rpcServiceThird.register('third', msg => Promise.resolve('hello'), 'rpc', rpcOptions);

    await rpcServiceSecond.register('second', msg => {
      return rpcServiceSecond.invoke<any, string>('third', 1234);
    }, 'rpc');

    await rpcService.register('first', msg => {
      return rpcService.invoke<string, string>('second', 'hello');
    }, 'rpc');

    try {
      const p = await rpcServiceSecond.invoke<string, string>('first', 'hello');
      console.log(p);
    } catch (e) {
      await rpcServiceSecond.unregister('second');
      await rpcServiceThird.unregister('third');
      expect(e.errorCode).toBe('ISLAND.LOGIC.L0002_WRONG_PARAMETER_SCHEMA');
      expect(e.occurredIn).toBe('third');
    }
  }));
});

describe('RPC with reviver', async () => {
  const url = process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672';
  const rpcService = new RPCService('haha');
  const amqpChannelPool = new AmqpChannelPoolService();

  async function invokeTest(opts?) {
    await rpcService.initialize(amqpChannelPool, opts);
    await rpcService.register('testMethod', msg => Promise.resolve(new Date().toISOString()), 'rpc');
    return await rpcService.invoke<string, any>('testMethod', 'hello');
  }

  beforeEach(spec(async () => {
    await amqpChannelPool.initialize({ url });
  }));

  afterEach(spec(async () => {
    await Bluebird.delay(100);
    await TraceLog.purge();
    await rpcService.purge();
    await amqpChannelPool.purge();
  }));

  it('should convert an ISODate string to Date', spec(async () => {
    const res = await invokeTest();
    expect(typeof res).toEqual('object');
    expect(res instanceof Date).toBeTruthy();
  }));

  it('should keep an ISODate string as string with noReviver', spec(async () => {
    const res = await invokeTest({ noReviver: true });
    expect(typeof res).toEqual('string');
    expect(res instanceof Date).toBeFalsy();
  }));
});

describe('RPC-hook', () => {
  const url = process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672';
  const rpcService = new RPCService('haha');
  const amqpChannelPool = new AmqpChannelPoolService();

  beforeEach(spec(async () => {
    await amqpChannelPool.initialize({ url });
    await rpcService.initialize(amqpChannelPool);
  }));

  afterEach(spec(async () => {
    await Bluebird.delay(100);
    await TraceLog.purge();
    await rpcService.purge();
    await amqpChannelPool.purge();
  }));

  it('could change the request body by pre-hook', spec(async () => {
    rpcService.registerHook(RpcHookType.PRE_RPC, content => Promise.resolve('hi, ' + content));
    await rpcService.register('testMethod', msg => Promise.resolve(msg + ' world'), 'rpc');
    const res = await rpcService.invoke('testMethod', 'hello');
    expect(res).toEqual('hi, hello world');
  }));

  it('could change the response body by post-hook', spec(async () => {
    rpcService.registerHook(RpcHookType.POST_RPC, content => {
      content.__fixed = true;
      return Promise.resolve(content);
    });
    await rpcService.register('testMethod', msg => Promise.resolve({[msg]: 'world'}), 'rpc');
    const res = await rpcService.invoke('testMethod', 'hello');
    expect(res).toEqual({__fixed: true, hello: 'world'});
  }));

  it('could add multiple pre-hooks', spec(async () => {
    rpcService.registerHook(RpcHookType.PRE_RPC, content => Promise.resolve('hi, ' + content));
    rpcService.registerHook(RpcHookType.PRE_RPC, content => Promise.resolve('hey, ' + content));
    await rpcService.register('testMethod', msg => Promise.resolve(msg + ' world'), 'rpc');
    const res = await rpcService.invoke('testMethod', 'hello');
    expect(res).toEqual('hey, hi, hello world');
  }));

  it('could add multiple post-hooks', spec(async () => {
    rpcService.registerHook(RpcHookType.POST_RPC, content => Promise.resolve({first: content}));
    rpcService.registerHook(RpcHookType.POST_RPC, content => Promise.resolve({second: content}));
    await rpcService.register('testMethod', msg => Promise.resolve({[msg]: 'world'}), 'rpc');
    const res = await rpcService.invoke('testMethod', 'hello');
    expect(res).toEqual({second: {first: {hello: 'world'}}});
  }));

  it('should share the hooks with every RPCs', spec(async () => {
    rpcService.registerHook(RpcHookType.PRE_RPC, content => Promise.resolve('hi-' + content));
    rpcService.registerHook(RpcHookType.PRE_RPC, content => Promise.resolve('hey-' + content));
    rpcService.registerHook(RpcHookType.POST_RPC, content => Promise.resolve({first: content}));
    rpcService.registerHook(RpcHookType.POST_RPC, content => Promise.resolve({second: content}));
    await rpcService.register('world', msg => Promise.resolve({[msg]: 'world'}), 'rpc');
    await rpcService.register('hell', msg => Promise.resolve({[msg]: 'hell'}), 'rpc');

    expect(await rpcService.invoke('world', 'hello'))
      .toEqual({second: {first: {'hey-hi-hello': 'world'}}});

    expect(await rpcService.invoke('hell', 'damn'))
      .toEqual({second: {first: {'hey-hi-damn': 'hell'}}});
  }));

  it('could change the error object before respond', spec(async () => {
    rpcService.registerHook(RpcHookType.PRE_RPC_ERROR, e => {
      e.extra = 'pre-hooked';
      return Promise.resolve(e);
    });
    await rpcService.register('world', msg => Promise.reject(new Error('custom error')), 'rpc');

    try {
      await rpcService.invoke('world', 'hello');
      expect(true).toEqual(false);
    } catch (e) {
      expect(e.message).toMatch(/custom error/);
      expect(e.extra).toEqual('pre-hooked');
    }
  }));

  it('could not change the error object with POST_RPC_ERROR', spec(async () => {
    let haveBeenCalled = false;
    rpcService.registerHook(RpcHookType.PRE_RPC_ERROR, e => {
      e.extra = 'pre-hooked';
      return Promise.resolve(e);
    });
    rpcService.registerHook(RpcHookType.POST_RPC_ERROR, e => {
      e.extra = 'post-hooked';
      haveBeenCalled = true;
      return Promise.resolve(e);
    });
    await rpcService.register('world', msg => Promise.reject(new Error('custom error')), 'rpc');

    try {
      await rpcService.invoke('world', 'hello');
      expect(true).toEqual(false);
    } catch (e) {
      await Bluebird.delay(1);
      expect(e.extra).toEqual('pre-hooked');
      expect(haveBeenCalled).toBeTruthy();
    }
  }));
});
