export default class StaticDataLoader<T> {
    protected object: T;
    readonly Object: T;
    initialize(): Promise<any>;
}
