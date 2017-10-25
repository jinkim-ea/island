/// <reference types="node" />
import { AbstractError } from '../utils/error';
export interface IRpcResponse {
    version: number;
    result: boolean;
    body?: AbstractError | any;
}
export interface PlainRpcError {
    name: string;
    message: string;
    code: number;
    reason: string;
    statusCode?: number;
    stack: string;
    extra: any;
}
export declare class RpcResponse {
    static reviver: ((k, v) => any) | undefined;
    static encode(body: any): Buffer;
    static decode(msg: Buffer): IRpcResponse;
    static getAbstractError(err: PlainRpcError): AbstractError;
}
