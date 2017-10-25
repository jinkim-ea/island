import { RpcRequest } from '../services/rpc-service';
export declare function sanitize(subschema: any, target: any): any;
export declare function validate(subschema: any, target: any): boolean;
export default function paramSchemaInspector(req: RpcRequest): void;
