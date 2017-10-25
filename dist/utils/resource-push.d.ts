/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
import PushService from '../services/push-service';
export declare class ResourcePush {
    private pushService;
    private resourceTargets;
    constructor(pushService: PushService);
    target(id: string): ResourceTarget;
    disposer(): Bluebird.Disposer<any>;
}
export interface ResourceChange {
    uri: string;
    body?: any;
    delete?: boolean;
}
export declare class ResourcePath {
    protected fullPath: string;
    protected changes: ResourceChange[];
    constructor(fullPath: string, changes: ResourceChange[]);
    path(path: string): ResourceModifier;
    all(path: string): ResourceModifier;
    one(path: string, id: string): ResourceModifier;
}
export declare class ResourceModifier extends ResourcePath {
    constructor(fullPath: string, changes: ResourceChange[]);
    set(body: any): void;
    remove(): void;
    add(body: {
        id: string;
    }): void;
}
export declare class ResourceTarget extends ResourcePath {
    private target;
    private pushService;
    constructor(target: string, pushService: PushService);
    flush(): Promise<any>;
}
