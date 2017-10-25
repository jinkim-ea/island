"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Bluebird = require("bluebird");
const jasmine_async_support_1 = require("../utils/jasmine-async-support");
const logger_1 = require("../utils/logger");
const interval_helper_1 = require("../utils/interval-helper");
function testFunction() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Bluebird.delay(3000);
        logger_1.logger.debug('test Interval Function Working!');
    });
}
describe('IntervalService', () => {
    afterEach(jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield Bluebird.delay(500);
        yield interval_helper_1.IntervalHelper.purge();
    })));
    it('can use island Interval', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield interval_helper_1.IntervalHelper.setIslandInterval(testFunction, 1000);
        const res = yield interval_helper_1.IntervalHelper.getIntervalList();
        expect(res.length).toBe(1);
    })));
    it('can register multiple Interval', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield interval_helper_1.IntervalHelper.setIslandInterval(testFunction, 1000);
        yield interval_helper_1.IntervalHelper.setIslandInterval(testFunction, 1000);
        const res = yield interval_helper_1.IntervalHelper.getIntervalList();
        yield Bluebird.delay(3000);
        expect(res.length).toBeTruthy();
    })));
    it('can get Interval Info', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield interval_helper_1.IntervalHelper.setIslandInterval(testFunction, 1000);
        const res = yield interval_helper_1.IntervalHelper.getIntervalList();
        yield Bluebird.delay(1000);
        expect(res.length).toBeTruthy();
    })));
    it('can purge IntervalService', jasmine_async_support_1.jasmineAsyncAdapter(() => __awaiter(this, void 0, void 0, function* () {
        yield interval_helper_1.IntervalHelper.setIslandInterval(testFunction, 1000);
        yield Bluebird.delay(1000);
        yield interval_helper_1.IntervalHelper.purge();
        const res = yield interval_helper_1.IntervalHelper.getIntervalList();
        expect(res.length).toBe(0);
    })));
});
//# sourceMappingURL=interval-service.spec.js.map