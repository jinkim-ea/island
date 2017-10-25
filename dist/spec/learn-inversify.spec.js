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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
require("reflect-metadata");
require("source-map-support/register");
const logger_1 = require("../utils/logger");
const inversify = require("inversify");
const inject = (target, key, index) => {
    if (!Reflect.hasOwnMetadata('design:paramtypes', target)) {
        logger_1.logger.error('metadata required');
        return;
    }
    const paramTypes = Reflect.getMetadata('design:paramtypes', target);
    return inversify.inject(paramTypes[index])(target, key, index);
};
const injectable = (target) => {
    if (Reflect.hasOwnMetadata('inversify:paramtypes', target) === true) {
        return;
    }
    return inversify.injectable()(target);
};
class KernelWrapper {
    constructor() {
        this.kernel = new inversify.Kernel();
    }
    bindClass(aClass) {
        inversify.decorate(injectable, aClass);
        this.kernel.bind(aClass).to(aClass).when(request => !request.target.isNamed());
    }
    bindClassNamed(id, aClass, name) {
        inversify.decorate(injectable, aClass);
        this.kernel.bind(id).to(aClass).whenTargetNamed(name);
    }
    bindValue(name, value) {
        this.kernel.bind(name).toConstantValue(value);
    }
    get(identifier) {
        return this.kernel.get(identifier);
    }
}
class Foo {
    say() { return 'foo'; }
}
class Fooo {
    say() { return 'fooo'; }
}
class Baz {
    say() { return 'value'; }
}
let Bar = class Bar {
    constructor(foo) {
        this.foo = foo;
    }
    letFooSay() { return this.foo.say(); }
};
Bar = __decorate([
    __param(0, inject),
    __metadata("design:paramtypes", [Foo])
], Bar);
describe('inversify', () => {
    const kernelWrapper = new KernelWrapper();
    beforeAll(() => {
        kernelWrapper.bindClass(Foo);
        kernelWrapper.bindClassNamed(Foo, Foo, 'foo');
        kernelWrapper.bindClassNamed(Foo, Fooo, 'fooo');
        kernelWrapper.bindClass(Bar);
        kernelWrapper.bindValue('Baz', new Baz());
    });
    it(`should inject Foo into Bar`, () => {
        const bar = kernelWrapper.get(Bar);
        expect(bar.letFooSay()).toBe('foo');
    });
    it(`should inject Value`, () => {
        expect(kernelWrapper.get('Baz')).toEqual(jasmine.any(Baz));
    });
});
//# sourceMappingURL=learn-inversify.spec.js.map