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
"use strict";
function jasmineAsyncAdapter(assertion) {
    // tslint:disable-next-line
    return function (done) {
        assertion.call(this).then(done, done.fail);
    };
}
exports.jasmineAsyncAdapter = jasmineAsyncAdapter;
function createSpyObjWithAllMethods(ctor) {
    const methods = Object.getOwnPropertyNames(ctor.prototype)
        .filter(name => name !== 'constructor');
    if (!methods || methods.length === 0) {
        return {};
    }
    return jasmine.createSpyObj(ctor.name, methods);
}
exports.createSpyObjWithAllMethods = createSpyObjWithAllMethods;
function resetSpyObjWithCallsCount(obj) {
    const methods = Object.getOwnPropertyNames(obj)
        .filter(name => name !== 'constructor');
    if (!methods || methods.length === 0) {
        return;
    }
    for (const method of methods) {
        obj[method].calls.reset();
    }
}
exports.resetSpyObjWithCallsCount = resetSpyObjWithCallsCount;
//# sourceMappingURL=jasmine-async-support.js.map