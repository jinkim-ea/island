import { RpcOptions } from '../controllers/rpc-decorator';

export interface RpcRequest {
  name: string;
  msg: any;
  options: RpcOptions;
}
