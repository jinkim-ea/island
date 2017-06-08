import { AbstractError, AbstractFatalError, AbstractLogicError } from '../utils/error';
import { logger } from '../utils/logger';
import reviver from '../utils/reviver';

export interface IRpcResponse {
  version: number;
  result: boolean;
  body?: AbstractError | any;
}

export class RpcResponse {
  static reviver: ((k, v) => any) | undefined = reviver;
  static encode(body: any, serviceName: string): Buffer {
    const res: IRpcResponse = {
      body,
      result: body instanceof Error ? false : true,
      version: 1
    };

    return new Buffer(JSON.stringify(res, (k, v: AbstractError | number | boolean) => {
      // TODO instanceof Error should AbstractError
      if (v instanceof Error) {
        const e = v as AbstractError;
        return {
          debugMsg: e.debugMsg,
          errorCode: e.errorCode,
          errorKey: e.errorKey,
          errorNumber: e.errorNumber,
          errorType: e.errorType,
          extra: e.extra,
          message: e.message,
          name: e.name,
          occurredIn: e.occurredIn || serviceName,
          stack: e.stack,
          statusCode: e.statusCode
        };
      }
      return v;
    }), 'utf8');
  }

  static decode(msg: Buffer): IRpcResponse {
    try {
      const res: IRpcResponse = JSON.parse(msg.toString('utf8'), RpcResponse.reviver);
      if (!res.result) res.body = this.getAbstractError(res.body);

      return res;
    } catch (e) {
      logger.notice('[decode error]', e);
      return { version: 0, result: false };
    }
  }

 static getAbstractError(err: AbstractError): AbstractError {
    let result: AbstractError;
    const enumObj = {};
    enumObj[err.errorNumber] = err.errorKey;
    const occurredIn = err.extra && err.extra.island || err.occurredIn;
    switch (err.errorType) {
      case 'LOGIC':
        result = new AbstractLogicError(err.errorNumber, err.debugMsg, occurredIn, enumObj);
        break;
      case 'FATAL':
        result = new AbstractFatalError(err.errorNumber, err.debugMsg, occurredIn, enumObj);
        break;
      default:
        result = new AbstractError('ETC', 1, err.message, occurredIn, { 1: 'F0001' });
        result.name = 'ETCError';
    }

    result.statusCode = err.statusCode;
    result.stack = err.stack;
    result.extra = err.extra;
    result.occurredIn = err.occurredIn;

    return result;
  }
}
