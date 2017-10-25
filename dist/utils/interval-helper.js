"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const _ = require("lodash");
const logger_1 = require("../utils/logger");
let list = [];
let onGoingIntervalCount = 0;
let purging = null;
var IntervalHelper;
(function (IntervalHelper) {
    function getIntervalList() {
        return list;
    }
    IntervalHelper.getIntervalList = getIntervalList;
    ;
    function setIslandInterval(handler, time) {
        return __awaiter(this, void 0, void 0, function* () {
            const job = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                onGoingIntervalCount++;
                yield handler();
                if (--onGoingIntervalCount < 1 && purging) {
                    purging();
                }
            }), time);
            yield list.push(job);
            return job;
        });
    }
    IntervalHelper.setIslandInterval = setIslandInterval;
    ;
    function purge() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('Island interval service purge');
            if (list) {
                yield Promise.all(_.map(list, (intervalHandler) => {
                    clearInterval(intervalHandler);
                }));
                list = [];
            }
            if (onGoingIntervalCount) {
                return new Promise((res, rej) => { purging = res; });
            }
            logger_1.logger.info('Terminated interval', list);
            return Promise.resolve();
        });
    }
    IntervalHelper.purge = purge;
})(IntervalHelper = exports.IntervalHelper || (exports.IntervalHelper = {}));
//# sourceMappingURL=interval-helper.js.map