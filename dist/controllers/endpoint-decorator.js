"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const _ = require("lodash");
const error_1 = require("../utils/error");
var EnsureOptions;
(function (EnsureOptions) {
    EnsureOptions[EnsureOptions["TOKEN"] = 1] = "TOKEN";
    EnsureOptions[EnsureOptions["SESSION"] = 2] = "SESSION";
    EnsureOptions[EnsureOptions["CONNECTION"] = 3] = "CONNECTION";
})(EnsureOptions = exports.EnsureOptions || (exports.EnsureOptions = {}));
function makeDecorator(func, type, subType) {
    return (obj) => {
        return (target, key, desc) => {
            const options = desc.value.options = (desc.value.options || {});
            _.merge(options, { schema: { [subType]: { [type]: func(obj) } } });
            if (desc.value.endpoints) {
                desc.value.endpoints.forEach(e => _.merge(e.options, options));
            }
        };
    };
}
var sanitize;
(function (sanitize_1) {
    sanitize_1.ObjectId = { $sanitize: Symbol() };
    sanitize_1.Cider = { $sanitize: Symbol() };
    sanitize_1.Any = { $sanitize: Symbol() };
    sanitize_1.NumberOrQuery = { $sanitize: Symbol() };
    // tslint:disable-next-line class-name
    class _Number {
        constructor({ def, min, max, strict }) {
            this.def = def;
            this.min = min;
            this.max = max;
            this.strict = strict;
        }
    }
    sanitize_1._Number = _Number;
    function Number({ def, min, max, strict }) {
        return new _Number({ def, min, max, strict });
    }
    sanitize_1.Number = Number;
    // tslint:disable-next-line
    class _String {
        constructor({ def, rules, minLength, maxLength, strict }) {
            this.def = def;
            this.rules = rules;
            this.minLength = minLength;
            this.maxLength = maxLength;
            this.strict = strict;
        }
    }
    sanitize_1._String = _String;
    function String({ def, rules, minLength, maxLength, strict }) {
        return new _String({ def, rules, minLength, maxLength, strict });
    }
    sanitize_1.String = String;
    // tslint:disable-next-line
    class _Object {
        constructor(obj, opts) {
            opts = opts || {};
            this.properties = obj;
            this.def = opts.def;
        }
    }
    sanitize_1._Object = _Object;
    // tslint:disable-next-line
    function Object(obj, opts) {
        return new _Object(obj, opts);
    }
    sanitize_1.Object = Object;
    // tslint:disable-next-line
    class _Array {
        constructor(items) {
            this.items = items;
        }
    }
    sanitize_1._Array = _Array;
    function Array(items) {
        return new _Array(items);
    }
    sanitize_1.Array = Array;
    // tslint:disable-next-line cyclomatic-complexity
    function parseSanitization(property, value) {
        if (value === undefined)
            return;
        if (value === global.String) {
            property.type = 'string';
        }
        else if (typeof value === 'string') {
            property.type = 'string';
            property.def = value;
        }
        else if (value instanceof _String) {
            property.type = 'string';
            _.merge(property, value);
        }
        else if (value === global.Number) {
            property.type = 'number';
        }
        else if (typeof value === 'number') {
            property.type = 'number';
            property.def = value;
        }
        else if (value instanceof _Number) {
            property.type = 'number';
            _.merge(property, value);
        }
        else if (value === Boolean) {
            property.type = 'boolean';
        }
        else if (value === Date) {
            property.type = 'date';
        }
        else if (value instanceof _Object) {
            property.type = 'object';
            property.properties = sanitizeAsObject(value.properties);
            _.defaults(property, value);
        }
        else if (value instanceof _Array) {
            property.type = 'array';
            property.items = sanitizeAsArray(value.items);
        }
        else if (value === sanitize_1.ObjectId) {
            property.type = '$oid';
        }
        else if (value === sanitize_1.Cider) {
            property.type = '$cider';
        }
        else if (value === sanitize_1.NumberOrQuery) {
            property.type = '$numberOrQuery';
        }
        return _.omitBy(property, _.isUndefined);
    }
    // schema-inspector 문법은 array에 들어올 수 있는 타입을 한 개 이상 받을 수 있게 되어있지만
    // 여기서는 가장 첫번째 한 개만 처리하고 있다. 인터페이스 구조상 여러 개도 처리할 수 있지만 단순히 안 한 것 뿐이다.
    // @kson //2016-08-04
    function sanitizeAsArray([item]) {
        const property = { optional: true };
        return parseSanitization(property, item);
    }
    // sanitization은 optional의 기본값이 true
    // https://github.com/Atinux/schema-inspector#s_optional
    // 헷갈리니까 생략하면 기본값, !는 required, ?는 optional로 양쪽에서 동일한 규칙을 쓰도록 한다
    // [example] validate: { a: 1, 'b?': 1, 'c!': 1 } - required / optional / required
    // [example] sanitize: { a: 1, 'b?': 1, 'c!': 1 } - optional / optional / required
    function sanitizeAsObject(obj) {
        if (!obj)
            return;
        const properties = {};
        _.each(obj, (value, key) => {
            const property = { optional: true };
            if (key.endsWith('?')) {
                property.optional = true;
                key = key.slice(0, -1);
            }
            else if (key.endsWith('!')) {
                property.optional = false;
                key = key.slice(0, -1);
            }
            if (key.includes('+')) {
                const [a] = key.split('+', 1);
                property.__langid = key;
                key = a;
            }
            properties[key] = parseSanitization(property, value);
        });
        return properties;
    }
    // tslint:disable-next-line cyclomatic-complexity
    function isPlainObject(target) {
        if (target instanceof _Number ||
            target instanceof _String ||
            target instanceof _Object ||
            target instanceof _Array ||
            target === global.Number ||
            target === global.String ||
            target === Boolean ||
            target === sanitize_1.ObjectId ||
            target === sanitize_1.Cider ||
            target === sanitize_1.NumberOrQuery ||
            target === sanitize_1.Any) {
            return false;
        }
        return true;
    }
    function sanitize(target) {
        if (global.Array.isArray(target)) {
            return {
                items: sanitizeAsArray(target),
                type: 'array'
            };
        }
        else if (isPlainObject(target)) {
            return {
                properties: sanitizeAsObject(target),
                type: 'object'
            };
        }
        return parseSanitization({}, target);
    }
    sanitize_1.sanitize = sanitize;
    sanitize_1.body = makeDecorator(sanitize, 'sanitization', 'body');
    sanitize_1.params = makeDecorator(sanitize, 'sanitization', 'params');
    sanitize_1.query = makeDecorator(sanitize, 'sanitization', 'query');
    sanitize_1.result = makeDecorator(sanitize, 'sanitization', 'result');
    sanitize_1.session = makeDecorator(sanitize, 'sanitization', 'session');
    sanitize_1.user = makeDecorator(sanitize, 'sanitization', 'user');
})(sanitize = exports.sanitize || (exports.sanitize = {}));
var validate;
(function (validate_1) {
    ;
    validate_1.ObjectId = { $validate: Symbol() };
    ;
    validate_1.Cider = { $validate: Symbol() };
    ;
    validate_1.NumberOrQuery = { $validate: Symbol() };
    ;
    validate_1.Any = { $validate: Symbol() };
    ;
    validate_1.Html = { $validate: Symbol() };
    // tslint:disable-next-line class-name
    class _Number {
        constructor({ lt, lte, gt, gte, eq, ne }) {
            this.lt = lt;
            this.lte = lte;
            this.gt = gt;
            this.gte = gte;
            this.eq = eq;
            this.ne = ne;
        }
    }
    validate_1._Number = _Number;
    function Number({ lt, lte, gt, gte, eq, ne }) {
        return new _Number({ lt, lte, gt, gte, eq, ne });
    }
    validate_1.Number = Number;
    // tslint:disable-next-line class-name
    class _String {
        constructor({ minLength, maxLength, exactLength, eq, ne }) {
            this.minLength = minLength;
            this.maxLength = maxLength;
            this.exactLength = exactLength;
            this.eq = eq;
            this.ne = ne;
        }
    }
    validate_1._String = _String;
    function String({ minLength, maxLength, exactLength, eq, ne }) {
        return new _String({ minLength, maxLength, exactLength, eq, ne });
    }
    validate_1.String = String;
    // tslint:disable-next-line class-name
    class _Object {
        constructor(obj) {
            this.properties = obj;
        }
    }
    validate_1._Object = _Object;
    function Object(obj) {
        return new _Object(obj);
    }
    validate_1.Object = Object;
    // tslint:disable-next-line class-name
    class _Array {
        constructor(items, opts) {
            opts = opts || {};
            this.items = items;
            this.minLength = opts.minLength;
            this.maxLength = opts.maxLength;
            this.exactLength = opts.exactLength;
        }
    }
    validate_1._Array = _Array;
    function Array(items, opts) {
        return new _Array(items, opts);
    }
    validate_1.Array = Array;
    // tslint:disable-next-line cyclomatic-complexity
    function parseValidation(property, value) {
        if (value === global.String) {
            property.type = 'string';
        }
        else if (value instanceof _String) {
            property.type = 'string';
            _.merge(property, value);
        }
        else if (value === global.Number) {
            property.type = 'number';
        }
        else if (value instanceof _Number) {
            property.type = 'number';
            _.merge(property, value);
        }
        else if (value === Boolean) {
            property.type = 'boolean';
        }
        else if (value === Date) {
            property.type = 'date';
        }
        else if (value instanceof _Object) {
            property.type = 'object';
            property.properties = validateAsObject(value.properties);
        }
        else if (value instanceof _Array) {
            property.type = 'array';
            _.defaults(property, validateAsArrayWithOptions(value));
        }
        else if (value === validate_1.Any) {
            property.type = 'any';
        }
        else if (value === validate_1.ObjectId) {
            property.type = '$oid';
        }
        else if (value === validate_1.Cider) {
            property.type = '$cider';
        }
        else if (value === validate_1.NumberOrQuery) {
            property.type = '$numberOrQuery';
        }
        else if (value === validate_1.Html) {
            property.type = '$html';
        }
        return _.omitBy(property, _.isUndefined);
    }
    // schema-inspector 문법은 array에 들어올 수 있는 타입을 한 개 이상 받을 수 있게 되어있지만
    // 여기서는 가장 첫번째 한 개만 처리하고 있다. 인터페이스 구조상 여러 개도 처리할 수 있지만 단순히 안 한 것 뿐이다.
    // @kson //2016-08-04
    function validateAsArray(items) {
        if (!items)
            return;
        const item = items[0];
        const property = { optional: false };
        return parseValidation(property, item);
    }
    // v.Array로 선언되어 Option이 있는 경우 이 함수가 사용된다.
    function validateAsArrayWithOptions(obj) {
        obj = obj || {};
        if (!obj.items)
            return;
        const item = obj.items;
        const property = { optional: false };
        _.each(obj, (value, key) => {
            if (key === 'items') {
                property.items = validateAsArray(item);
            }
            else {
                property[key] = value;
            }
        });
        return parseValidation(property, item);
    }
    // validation의 optional의 기본값은 false
    // https://github.com/Atinux/schema-inspector#v_optional
    // 헷갈리니까 생략하면 기본값, !는 required, ?는 optional로 양쪽에서 동일한 규칙을 쓰도록 한다
    // [example] validate: { a: 1, 'b?': 1, 'c!': 1 } - required / optional / required
    // [example] sanitize: { a: 1, 'b?': 1, 'c!': 1 } - optional / optional / required
    function validateAsObject(obj) {
        if (!obj)
            return;
        const properties = {};
        _.each(obj, (value, key) => {
            const property = { optional: false };
            if (key.endsWith('?')) {
                property.optional = true;
                key = key.slice(0, -1);
            }
            else if (key.endsWith('!')) {
                property.optional = false;
                key = key.slice(0, -1);
            }
            if (key.includes('+')) {
                const [a] = key.split('+', 1);
                property.__langid = key;
                key = a;
            }
            properties[key] = parseValidation(property, value);
        });
        return properties;
    }
    // tslint:disable-next-line cyclomatic-complexity
    function isPlainObject(target) {
        if (target instanceof _Number ||
            target instanceof _String ||
            target instanceof _Object ||
            target instanceof _Array ||
            target === global.Number ||
            target === global.String ||
            target === Boolean ||
            target === validate_1.ObjectId ||
            target === validate_1.Cider ||
            target === validate_1.NumberOrQuery ||
            target === validate_1.Any) {
            return false;
        }
        return true;
    }
    function validate(target) {
        if (global.Array.isArray(target)) {
            // 여기에서 체크된 Array는 option이 없는 경우이다.
            return {
                items: validateAsArray(target),
                type: 'array'
            };
        }
        else if (isPlainObject(target)) {
            return {
                properties: validateAsObject(target),
                type: 'object'
            };
        }
        return parseValidation({}, target);
    }
    validate_1.validate = validate;
    validate_1.body = makeDecorator(validate, 'validation', 'body');
    validate_1.params = makeDecorator(validate, 'validation', 'params');
    validate_1.query = makeDecorator(validate, 'validation', 'query');
    validate_1.result = makeDecorator(validate, 'validation', 'result');
    validate_1.session = makeDecorator(validate, 'validation', 'session');
    validate_1.user = makeDecorator(validate, 'validation', 'user');
})(validate = exports.validate || (exports.validate = {}));
// Login ensure 레벨을 지정
// TOKEN : 토큰 확인
// SESSION : SESSION 확인
// CONNECTION : client의 push-island 연결 확인
//
// [EXAMPLE]
// @island.ensure(island.EnsureOptions.CONNECTION)
// @island.ensure(3)
// @island.endpoint('...', { ensure: island.EnsureOptions.CONNECTION })
function ensure(ensure) {
    return (target, key, desc) => {
        const options = desc.value.options = (desc.value.options || {});
        options.ensure = (ensure || options.ensure) || EnsureOptions.TOKEN;
        if (desc.value.endpoints) {
            desc.value.endpoints.forEach(e => _.merge(e.options, options));
        }
    };
}
exports.ensure = ensure;
// - request에 session을 붙이지 않도록 해준다.
// - session이 필요하지 않은 endpoint에 사용.
//
// [EXAMPLE]
// @island.nosession()
// @island.endpoint('...', { ignoreSession: true })
function nosession() {
    return (target, key, desc) => {
        const options = desc.value.options = (desc.value.options || {});
        options.ignoreSession = true;
        if (desc.value.endpoints) {
            desc.value.endpoints.forEach(e => _.merge(e.options, options));
        }
    };
}
exports.nosession = nosession;
// - EndpointOptions#level 속성의 Syntactic Sugar 이다
// - @endpoint 데코레이터의 옵션에서 레벨을 선언하는 것과 @auth 데코레이터의 효과는 동일하다
// - 선언이 중복될 경우 높은 레벨이 남는다
// - 어떤 순서로 선언되어도 효과는 동일하다
//
// [EXAMPLE]
// @island.auth(10)
// @island.endpoint('...', { level: 10 })
function auth(level) {
    return (target, key, desc) => {
        const options = desc.value.options = (desc.value.options || {});
        options.level = Math.max(options.level || 0, level);
        if (desc.value.endpoints) {
            desc.value.endpoints.forEach(e => _.merge(e.options, options));
        }
    };
}
exports.auth = auth;
// - EndpointOptions#level, EndpointOptions#admin 속성의 Syntactic Sugar 이다
// [EXAMPLE]
// @island.endpoint('GET /v2/a', {})
// @island.admin
// @island.endpoint('GET /v2/b', {})
function admin(target, key, desc) {
    const options = desc.value.options = (desc.value.options || {});
    options.level = Math.max(options.level || 0, 9);
    options.admin = true;
    if (desc.value.endpoints) {
        desc.value.endpoints.forEach(e => {
            _.merge(e.options, options);
        });
    }
}
exports.admin = admin;
// - 예외적인 케이스로 인해 특정 endpoint의 호출을 제어하고자 할 때 사용 한다
// - 2017.07.21
// - nosession, devonly도 점차적으로 extra 데코레이터를 쓰도록 가이드해야 한다
// [EXAMPLE] admin API 이외에 내부망의 전용 gateway를 통해서만 통신해야만 하는 endpoint의 경우
// @island.auth(0)
// @island.extra({internal: true})
// @island.endpoint('GET /v2/c', {})
function extra(extra) {
    return (target, key, desc) => {
        const options = desc.value.options = (desc.value.options || {});
        options.extra = extra || {};
        if (desc.value.endpoints) {
            desc.value.endpoints.forEach(e => _.merge(e.options, options));
        }
    };
}
exports.extra = extra;
function devonly(target, key, desc) {
    const options = desc.value.options = (desc.value.options || {});
    options.developmentOnly = true;
    if (desc.value.endpoints) {
        desc.value.endpoints.forEach(e => {
            _.merge(e.options, options);
        });
    }
}
exports.devonly = devonly;
function mangle(name) {
    return name.replace(' ', '@').replace(/\//g, '|');
}
exports.mangle = mangle;
function pushSafe(object, arrayName, element) {
    const array = object[arrayName] = object[arrayName] || [];
    array.push(element);
}
// endpoint에 userQuota를 설정한다.
//
// [EXAMPLE]
// @island.quota(1, 2)
// @island.endpoint('...')
function quota(limit, banSecs) {
    return (target, key, desc) => {
        const options = desc.value.options = (desc.value.options || {});
        options.quota = options.quota || {};
        options.quota.limit = Number(limit);
        options.quota.banSecs = Number(banSecs);
        if (desc.value.endpoints) {
            desc.value.endpoints.forEach(e => _.merge(e.options, options));
        }
    };
}
exports.quota = quota;
// endpoint에 serviceQuota를 설정한다.
//
// [EXAMPLE]
// @island.servicdQuota(1, 2)
// @island.endpoint('...')
function serviceQuota(limit, group) {
    return (target, key, desc) => {
        const options = desc.value.options = (desc.value.options || {});
        group = group || [];
        options.serviceQuota = options.quota || {};
        options.serviceQuota.limit = Number(limit);
        if (group.length > 0) {
            options.serviceQuota.group = group;
        }
        if (desc.value.endpoints) {
            desc.value.endpoints.forEach(e => _.merge(e.options, options));
        }
    };
}
exports.serviceQuota = serviceQuota;
// endpoint에 quota Group을 설정한다.
//
// [EXAMPLE]
// @island.groupQuota([group1, gropu2])
// @island.endpoint('...')
function groupQuota(group) {
    return (target, key, desc) => {
        const options = desc.value.options = (desc.value.options || {});
        options.quota = options.quota || {};
        options.quota.group = group;
        if (desc.value.endpoints) {
            desc.value.endpoints.forEach(e => _.merge(e.options, options));
        }
    };
}
exports.groupQuota = groupQuota;
// - 컨트롤러 메소드 하나에 여러 endpoint를 붙일 수 있다.
//
// [EXAMPLE]
// @island.endpoint('GET /v2/blahblah', { level: 10, developmentOnly: true })
exports.endpoint = (() => {
    const decorator = makeEndpointDecorator();
    decorator.get = makeEndpointDecorator('GET');
    decorator.post = makeEndpointDecorator('POST');
    decorator.put = makeEndpointDecorator('PUT');
    decorator.del = makeEndpointDecorator('DEL');
    return decorator;
})();
function throwIfRedeclared(name) {
    const [method, uri] = name.split(' ');
    if (!method || !uri)
        return;
    if (['GET', 'POST', 'PUT', 'DEL'].indexOf(method.toUpperCase()) > -1) {
        throw new error_1.FatalError(error_1.ISLAND.FATAL.F0024_ENDPOINT_METHOD_REDECLARED);
    }
}
function makeEndpointDecorator(method) {
    // FIXME name -> URI?
    return (name, endpointOptions) => {
        if (method) {
            throwIfRedeclared(name);
        }
        return (target, key, desc) => {
            const handler = desc.value;
            const options = _.merge({}, handler.options || {}, endpointOptions);
            if (!options.hasOwnProperty('level')) {
                options.level = 7;
            }
            if (!options.hasOwnProperty('ensure')) {
                options.ensure = EnsureOptions.TOKEN;
            }
            name = [method, name].filter(Boolean).join(' ');
            const endpoint = { name, options, handler };
            pushSafe(handler, 'endpoints', endpoint);
            const constructor = target.constructor;
            pushSafe(constructor, '_endpointMethods', endpoint);
        };
    };
}
function endpointController(registerer) {
    return target => {
        const _onInitialized = target.prototype.onInitialized;
        // tslint:disable-next-line
        target.prototype.onInitialized = function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield Promise.all(_.map(target._endpointMethods, (v) => {
                    const developmentOnly = _.get(v, 'options.developmentOnly');
                    if (developmentOnly && process.env.NODE_ENV !== 'development')
                        return Promise.resolve();
                    v.name = mangle(v.name);
                    return this.server.register(v.name, v.handler.bind(this), 'endpoint').then(() => {
                        return registerer && registerer.registerEndpoint(v.name, v.options || {}) || Promise.resolve();
                    });
                }));
                return _onInitialized.apply(this);
            });
        };
    };
}
exports.endpointController = endpointController;
//# sourceMappingURL=endpoint-decorator.js.map