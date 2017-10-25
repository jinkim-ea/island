export declare enum EnsureOptions {
    TOKEN = 1,
    SESSION = 2,
    CONNECTION = 3,
}
export interface EndpointOptions {
    scope?: {
        resource: number;
        authority: number;
    };
    version?: string;
    schema?: EndpointSchemaOptions;
    developmentOnly?: boolean;
    ignoreSession?: boolean;
    level?: number;
    admin?: boolean;
    ensure?: number;
    quota?: EndpointUserQuotaOptions;
    serviceQuota?: EndpointServiceQuotaOptions;
    extra?: {
        [key: string]: any;
    };
}
export interface EndpointUserQuotaOptions {
    limit?: number;
    banSecs?: number;
    group?: string[];
}
export interface EndpointServiceQuotaOptions {
    limit?: number;
    group?: string[];
}
export interface EndpointSchemaOptions {
    body?: {
        sanitization?: any;
        validation?: any;
    };
    query?: {
        sanitization?: any;
        validation?: any;
    };
    params?: {
        sanitization?: any;
        validation?: any;
    };
    session?: {
        sanitization?: any;
        validation?: any;
    };
    result?: {
        sanitization?: any;
        validation?: any;
    };
}
export declare namespace sanitize {
    interface _ObjectId {
        $sanitize: Symbol;
    }
    const ObjectId: _ObjectId;
    interface _Cider {
        $sanitize: Symbol;
    }
    const Cider: _Cider;
    interface _Any {
        $sanitize: Symbol;
    }
    const Any: _Any;
    interface _NumberOrQuery {
        $sanitize: Symbol;
    }
    const NumberOrQuery: _NumberOrQuery;
    interface __Number {
        def?: number;
        min?: number;
        max?: number;
        strict?: boolean;
    }
    class _Number implements __Number {
        def?: number;
        min?: number;
        max?: number;
        strict?: boolean;
        constructor({def, min, max, strict}: __Number);
    }
    function Number({def, min, max, strict}: __Number): _Number;
    type _StringRules = 'upper' | 'lower' | 'title' | 'capitalize' | 'ucfirst' | 'trim';
    interface __String {
        def?: string;
        rules?: _StringRules | _StringRules[];
        minLength?: number;
        maxLength?: number;
        strict?: boolean;
    }
    class _String implements __String {
        def?: string;
        rules?: _StringRules | _StringRules[];
        minLength?: number;
        maxLength?: number;
        strict?: boolean;
        constructor({def, rules, minLength, maxLength, strict}: __String);
    }
    function String({def, rules, minLength, maxLength, strict}: __String): _String;
    interface __Object {
        def?: Object;
    }
    class _Object {
        properties: {
            [key: string]: SanitizePropertyTypes;
        } | undefined;
        def?: Object;
        constructor(obj?: {
            [key: string]: SanitizePropertyTypes;
        }, opts?: __Object | undefined);
    }
    function Object(obj: {
        [key: string]: SanitizePropertyTypes;
    }, opts?: __Object): _Object;
    class _Array {
        items: [SanitizePropertyTypes];
        constructor(items: [SanitizePropertyTypes]);
    }
    function Array(items: [SanitizePropertyTypes]): _Array;
    type SanitizePropertyTypes = typeof global.String | string | _String | typeof global.Number | number | _Number | typeof Boolean | typeof Date | _Object | _Array | _Any | _ObjectId | _Cider | _NumberOrQuery;
    function sanitize(target: SanitizePropertyTypes | {
        [key: string]: SanitizePropertyTypes;
    } | [SanitizePropertyTypes]): any;
    const body: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _Any | _NumberOrQuery | _Number | _String | _Object | _Array | [SanitizePropertyTypes] | {
        [key: string]: SanitizePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const params: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _Any | _NumberOrQuery | _Number | _String | _Object | _Array | [SanitizePropertyTypes] | {
        [key: string]: SanitizePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const query: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _Any | _NumberOrQuery | _Number | _String | _Object | _Array | [SanitizePropertyTypes] | {
        [key: string]: SanitizePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const result: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _Any | _NumberOrQuery | _Number | _String | _Object | _Array | [SanitizePropertyTypes] | {
        [key: string]: SanitizePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const session: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _Any | _NumberOrQuery | _Number | _String | _Object | _Array | [SanitizePropertyTypes] | {
        [key: string]: SanitizePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const user: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _Any | _NumberOrQuery | _Number | _String | _Object | _Array | [SanitizePropertyTypes] | {
        [key: string]: SanitizePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
}
export declare namespace validate {
    interface _ObjectId {
        $validate: Symbol;
    }
    const ObjectId: _ObjectId;
    interface _Cider {
        $validate: Symbol;
    }
    const Cider: _Cider;
    interface _NumberOrQuery {
        $validate: Symbol;
    }
    const NumberOrQuery: _NumberOrQuery;
    interface _Any {
        $validate: Symbol;
    }
    const Any: _Any;
    interface _Html {
        $validate: Symbol;
    }
    const Html: _Html;
    interface __Number {
        lt?: number;
        lte?: number;
        gt?: number;
        gte?: number;
        eq?: number | number[];
        ne?: number;
    }
    class _Number implements __Number {
        lt?: number;
        lte?: number;
        gt?: number;
        gte?: number;
        eq?: number | number[];
        ne?: number;
        constructor({lt, lte, gt, gte, eq, ne}: __Number);
    }
    function Number({lt, lte, gt, gte, eq, ne}: __Number): _Number;
    interface __String {
        minLength?: number;
        maxLength?: number;
        exactLength?: number;
        eq?: Array<string> | string;
        ne?: Array<string> | string;
    }
    class _String implements __String {
        minLength?: number;
        maxLength?: number;
        exactLength?: number;
        eq?: Array<string> | string;
        ne?: Array<string> | string;
        constructor({minLength, maxLength, exactLength, eq, ne}: __String);
    }
    function String({minLength, maxLength, exactLength, eq, ne}: __String): _String;
    class _Object {
        properties: {
            [key: string]: ValidatePropertyTypes;
        } | undefined;
        constructor(obj: {
            [key: string]: ValidatePropertyTypes;
        } | undefined);
    }
    function Object(obj?: {
        [key: string]: ValidatePropertyTypes;
    }): _Object;
    interface __Array {
        minLength?: number;
        maxLength?: number;
        exactLength?: number;
    }
    class _Array {
        items: [ValidatePropertyTypes] | undefined;
        minLength?: number;
        maxLength?: number;
        exactLength?: number;
        constructor(items: [ValidatePropertyTypes] | undefined, opts: __Array | undefined);
    }
    function Array(items?: [ValidatePropertyTypes], opts?: __Array): _Array;
    type ValidatePropertyTypes = typeof global.String | string | _String | typeof global.Number | number | _Number | typeof Boolean | typeof Date | _Object | _Array | _Any | _ObjectId | _Cider | _NumberOrQuery | _Html;
    function validate(target: ValidatePropertyTypes | {
        [key: string]: ValidatePropertyTypes;
    } | [ValidatePropertyTypes]): any;
    const body: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _NumberOrQuery | _Any | _Html | _Number | _String | _Object | _Array | [ValidatePropertyTypes] | {
        [key: string]: ValidatePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const params: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _NumberOrQuery | _Any | _Html | _Number | _String | _Object | _Array | [ValidatePropertyTypes] | {
        [key: string]: ValidatePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const query: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _NumberOrQuery | _Any | _Html | _Number | _String | _Object | _Array | [ValidatePropertyTypes] | {
        [key: string]: ValidatePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const result: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _NumberOrQuery | _Any | _Html | _Number | _String | _Object | _Array | [ValidatePropertyTypes] | {
        [key: string]: ValidatePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const session: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _NumberOrQuery | _Any | _Html | _Number | _String | _Object | _Array | [ValidatePropertyTypes] | {
        [key: string]: ValidatePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
    const user: (obj: string | number | StringConstructor | BooleanConstructor | NumberConstructor | DateConstructor | _ObjectId | _Cider | _NumberOrQuery | _Any | _Html | _Number | _String | _Object | _Array | [ValidatePropertyTypes] | {
        [key: string]: ValidatePropertyTypes;
    }) => (target: any, key: any, desc: PropertyDescriptor) => void;
}
export declare function ensure(ensure: number): (target: any, key: any, desc: PropertyDescriptor) => void;
export declare function nosession(): (target: any, key: any, desc: PropertyDescriptor) => void;
export declare function auth(level: number): (target: any, key: any, desc: PropertyDescriptor) => void;
export declare function admin(target: any, key: any, desc: any): void;
export declare function extra(extra: {
    [key: string]: any;
}): (target: any, key: any, desc: PropertyDescriptor) => void;
export declare function devonly(target: any, key: any, desc: any): void;
export declare function mangle(name: any): any;
export declare function quota(limit: number, banSecs: number): (target: any, key: any, desc: PropertyDescriptor) => void;
export declare function serviceQuota(limit: number, group?: string[]): (target: any, key: any, desc: PropertyDescriptor) => void;
export declare function groupQuota(group: string[]): (target: any, key: any, desc: PropertyDescriptor) => void;
export interface EndpointDecorator {
    (name: string, endpointOptions?: EndpointOptions): (target, key, desc: PropertyDescriptor) => any;
    get: (name: string, endpointOptions?: EndpointOptions) => (target, key, desc: PropertyDescriptor) => any;
    post: (name: string, endpointOptions?: EndpointOptions) => (target, key, desc: PropertyDescriptor) => any;
    put: (name: string, endpointOptions?: EndpointOptions) => (target, key, desc: PropertyDescriptor) => any;
    del: (name: string, endpointOptions?: EndpointOptions) => (target, key, desc: PropertyDescriptor) => any;
}
export declare const endpoint: EndpointDecorator;
export declare function endpointController(registerer?: {
    registerEndpoint: (name: string, value: any) => Promise<any>;
}): (target: any) => void;
