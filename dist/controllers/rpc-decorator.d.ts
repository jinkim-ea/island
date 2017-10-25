export interface RpcOptions {
    version?: string;
    schema?: RpcSchemaOptions;
    developmentOnly?: boolean;
}
export interface RpcSchemaOptions {
    query?: {
        sanitization: any;
        validation: any;
    };
    result?: {
        sanitization: any;
        validation: any;
    };
}
export declare function rpc(rpcOptions?: RpcOptions): (target: any, name: any, desc: PropertyDescriptor) => void;
export declare function rpcController(registerer?: {
    registerRpc: (name: string, value: any) => Promise<any>;
}): (target: any) => void;
