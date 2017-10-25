"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const island = require("../controllers/endpoint-decorator");
const error_1 = require("../utils/error");
function fakeDecorate(decorator) {
    const target = { constructor: {} };
    decorator(target, null, { value: { options: {} } });
    return target.constructor._endpointMethods[0];
}
function fakeDecorate2(decorator) {
    const desc = { value: { options: {} } };
    decorator({}, null, desc);
    return desc.value;
}
describe('@endpoint', () => {
    it('should be decorator itself', () => {
        class XX {
            getTest() { }
        }
        __decorate([
            island.endpoint('GET /test'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], XX.prototype, "getTest", null);
        const YY = XX;
        expect(YY._endpointMethods).toBeTruthy();
        expect(YY._endpointMethods[0]).toBeTruthy();
        expect(YY._endpointMethods[0].name).toEqual('GET /test');
    });
    it('should have separated methods', () => {
        expect(fakeDecorate(island.endpoint.get('/test')).name).toEqual('GET /test');
        expect(fakeDecorate(island.endpoint.post('/test')).name).toEqual('POST /test');
        expect(fakeDecorate(island.endpoint.put('/test')).name).toEqual('PUT /test');
        expect(fakeDecorate(island.endpoint.del('/test')).name).toEqual('DEL /test');
    });
    it('should prevent mistakes to redeclare method', () => {
        expect(() => fakeDecorate(island.endpoint.get('GET /test')).name).toThrowError(error_1.FatalError, /.*10010024.*/);
        expect(() => fakeDecorate(island.endpoint.get('get /test')).name).toThrowError(error_1.FatalError, /.*10010024.*/);
        expect(() => fakeDecorate(island.endpoint.get('POST /test')).name).toThrowError(error_1.FatalError, /.*10010024.*/);
    });
    it('auth, admin, devonly Test ', () => {
        expect(fakeDecorate2(island.auth(10))).toEqual({ options: { level: 10 } });
        expect(fakeDecorate2(island.admin)).toEqual({ options: { level: 9, admin: true } });
        expect(fakeDecorate2(island.extra({ internal: true }))).toEqual({ options: { extra: { internal: true } } });
        expect(fakeDecorate2(island.devonly)).toEqual({ options: { developmentOnly: true } });
        expect(fakeDecorate2(island.ensure(island.EnsureOptions.SESSION))).toEqual({ options: { ensure: 2 } });
        expect(fakeDecorate2(island.nosession())).toEqual({ options: { ignoreSession: true } });
    });
});
//# sourceMappingURL=endpoint-decorator.spec.js.map