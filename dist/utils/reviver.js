"use strict";
const reviver = (k, v) => {
    // ISODateTime format이 존재하면 Date 객체로 변환한다
    // tslint:disable-next-line
    const isoDateTimeFormat = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
    if (isoDateTimeFormat.test(v))
        return new Date(v);
    return v;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = reviver;
//# sourceMappingURL=reviver.js.map