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
class ScopeExit {
    constructor() {
        this.tasksOnFulfilled = [];
        this.tasksOnRejected = [];
    }
    defer(task) {
        return this.onFulfilled(task);
    }
    onFulfilled(task) {
        this.tasksOnFulfilled.push(task);
        return this;
    }
    onRejected(task) {
        this.tasksOnRejected.push(task);
        return this;
    }
    disposer() {
        return Bluebird.resolve(this).disposer((result, promise) => __awaiter(this, void 0, void 0, function* () {
            let tasks;
            if (promise.isFulfilled()) {
                tasks = this.tasksOnFulfilled;
            }
            else {
                tasks = this.tasksOnRejected;
            }
            for (const task of tasks) {
                yield task();
            }
        }));
    }
}
exports.ScopeExit = ScopeExit;
//# sourceMappingURL=scope-exit.js.map