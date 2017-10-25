"use strict";
const msgpack5 = require("msgpack5");
const error_1 = require("../utils/error");
const logger_1 = require("../utils/logger");
class MessagePack {
    constructor() {
        this.packer = msgpack5();
        if (MessagePack.instance) {
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0022_NOT_INITIALIZED_EXCEPTION, 'Error: Instantiation failed: Use getInst() instead of new.');
        }
        MessagePack.instance = this;
        // NOTE: timestamp를 직접 buffer에 쓰면 더 압축할 수 있다.
        this.packer.register(0x01, Date, (date) => {
            return new Buffer(date.toISOString());
        }, (buf) => {
            return new Date(buf.toString());
        });
        this.packer.register(0x03, Error, (error) => {
            return new Buffer(JSON.stringify({
                extra: error.extra,
                message: error.message,
                name: error.name,
                stack: error.stack,
                statusCode: error.statusCode
            }));
        }, (buf) => {
            const errorObject = JSON.parse(buf.toString());
            const err = new error_1.LogicError(error_1.ISLAND.LOGIC.L0004_MSG_PACK_ERROR, errorObject.message);
            err.name = errorObject.name;
            err.stack = errorObject.stack;
            err.statusCode = errorObject.statusCode;
            err.extra = errorObject.extra;
            return err;
        });
    }
    static getInst() {
        if (!MessagePack.instance) {
            MessagePack.instance = new MessagePack();
        }
        return MessagePack.instance;
    }
    encode(obj) {
        try {
            // msgpack.encode는 BufferList를 반환하지만, Buffer와 읽기 호환 인터페이스를 제공한다.
            // https://www.npmjs.com/package/bl
            // @kson //2016-08-23
            return this.packer.encode(obj);
        }
        catch (e) {
            logger_1.logger.debug('[MSG ENCODE ERROR]', e);
            const error = new error_1.LogicError(error_1.ISLAND.LOGIC.L0005_MSG_PACK_ENCODE_ERROR, e.message);
            logger_1.logger.debug(error.stack);
            throw e;
        }
    }
    decode(buf) {
        return this.packer.decode(buf);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MessagePack;
//# sourceMappingURL=msgpack.js.map