import { IAbstractAdapter } from './adapters/abstract-adapter';
/**
 * Create a new Islet.
 * @abstract
 * @class
 */
export default class Islet {
    /**
     * Retrieves a registered micro-service.
     * @returns {Microservice}
     * @static
     */
    static getIslet(): Islet;
    /**
     * Instantiate and run a microservice.
     * @param {Microservice} Class
     * @static
     */
    static run(subClass: typeof Islet): Promise<void> | undefined;
    private static islet;
    /**
     * Register the islet which is the suite of micro-service
     * @param {Islet} islet
     * @static
     */
    private static registerIslet(islet);
    /** @type {Object.<string, IAbstractAdapter>} [adapters={}] */
    private adapters;
    private listenAdapters;
    private baseAdapters;
    /**
     * Register the adapter.
     * @param {string} name
     * @param {IAbstractAdapter} adapter
     */
    registerAdapter(name: string, adapter: IAbstractAdapter): void;
    /**
     * @param {string} name
     * @returns {typeof Adapter}
     */
    getAdaptee<T>(name: string): T;
    /**
     * @abstract
     */
    main(): void;
    protected onPrepare(): void;
    protected onInitialized(): void;
    protected onDestroy(): void;
    protected onStarted(): void;
    /**
     * @returns {Promise<void>}
     */
    private initialize();
    private destroy();
}
