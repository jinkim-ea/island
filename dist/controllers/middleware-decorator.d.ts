/// <reference types="node" />
import * as events from 'events';
export declare class Response extends events.EventEmitter {
    private _body;
    private _statusCode;
    private _url;
    statusCode: number;
    readonly body: any;
    readonly url: string;
    end(body: any): void;
    redirect(url: string): void;
    setHeader(key: string, value: any): void;
}
export declare function middleware(...middlewares: ((req, res, next) => any)[]): (target: any, key: any, descriptor: any) => void;
