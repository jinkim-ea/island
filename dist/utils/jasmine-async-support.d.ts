/**
 * when using typescript async/await, awaiter wraps your function body and catches every exceptions.
 * so this adapter returns a function which invokes 'done' / 'done.fail' after the promise settled.
 *
 * example)
 *
 * import spec = island.spec;
 *
 * it('is a spec using async function', spec(async () => {
 *   await rejectSomething();
 * }));
 */
export declare function jasmineAsyncAdapter(assertion: () => Promise<void>): (done: any) => void;
export declare function createSpyObjWithAllMethods<T>(ctor: new (...args) => T): T;
export declare function resetSpyObjWithCallsCount(obj: any): void;
