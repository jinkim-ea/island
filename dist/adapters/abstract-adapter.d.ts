/**
 * IAbstractAdapter
 * @interface
 */
export interface IAbstractAdapter {
    adaptee: any;
    initialize(): any | Promise<any>;
    destroy(): any | Promise<any>;
}
/**
 * Abstract adapter class for back-end service.
 * @abstract
 * @class
 * @implements IAbstractAdapter
 */
export default class AbstractAdapter<T, U> implements IAbstractAdapter {
    protected _adaptee: T;
    protected _options: U | undefined;
    readonly adaptee: T;
    protected readonly options: U | undefined;
    constructor(options?: U);
    initialize(): any | Promise<any>;
    destroy(): any | Promise<any>;
}
