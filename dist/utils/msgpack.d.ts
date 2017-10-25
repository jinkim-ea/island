/// <reference types="node" />
export default class MessagePack {
    static getInst(): MessagePack;
    private static instance;
    private packer;
    constructor();
    encode(obj: any): Buffer;
    decode<T>(buf: Buffer | any): T;
}
