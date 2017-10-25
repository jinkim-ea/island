/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
export interface DeferredTask {
    (): any;
}
export declare class ScopeExit {
    private tasksOnFulfilled;
    private tasksOnRejected;
    defer(task: DeferredTask): ScopeExit;
    onFulfilled(task: DeferredTask): ScopeExit;
    onRejected(task: DeferredTask): ScopeExit;
    disposer(): Bluebird.Disposer<ScopeExit>;
}
