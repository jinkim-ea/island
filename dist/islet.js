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
const listenable_adapter_1 = require("./adapters/listenable-adapter");
const di_bind_1 = require("./utils/di-bind");
const error_1 = require("./utils/error");
const logger_1 = require("./utils/logger");
const status_exporter_1 = require("./utils/status-exporter");
const interval_helper_1 = require("./utils/interval-helper");
/**
 * Create a new Islet.
 * @abstract
 * @class
 */
class Islet {
    constructor() {
        /** @type {Object.<string, IAbstractAdapter>} [adapters={}] */
        this.adapters = {};
        this.listenAdapters = {};
        this.baseAdapters = {};
    }
    /**
     * Retrieves a registered micro-service.
     * @returns {Microservice}
     * @static
     */
    static getIslet() {
        return Islet.islet;
    }
    /**
     * Instantiate and run a microservice.
     * @param {Microservice} Class
     * @static
     */
    static run(subClass) {
        if (this.islet)
            return;
        // Create such a micro-service instance.
        const islet = new subClass();
        this.registerIslet(islet);
        islet.main();
        return islet.initialize();
    }
    /**
     * Register the islet which is the suite of micro-service
     * @param {Islet} islet
     * @static
     */
    static registerIslet(islet) {
        if (Islet.islet) {
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0001_ISLET_ALREADY_HAS_BEEN_REGISTERED, 'The islet already has been registered.');
        }
        Islet.islet = islet;
    }
    /**
     * Register the adapter.
     * @param {string} name
     * @param {IAbstractAdapter} adapter
     */
    registerAdapter(name, adapter) {
        if (this.adapters[name])
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0002_DUPLICATED_ADAPTER, 'duplicated adapter');
        this.adapters[name] = adapter;
        if (adapter instanceof listenable_adapter_1.default) {
            this.listenAdapters[name] = adapter;
        }
        else {
            this.baseAdapters[name] = adapter;
        }
    }
    /**
     * @param {string} name
     * @returns {typeof Adapter}
     */
    getAdaptee(name) {
        if (!this.adapters[name])
            throw new error_1.FatalError(error_1.ISLAND.FATAL.F0003_MISSING_ADAPTER, 'Missing adapter');
        return this.adapters[name].adaptee;
    }
    /**
     * @abstract
     */
    main() {
        throw new error_1.FatalError(error_1.ISLAND.FATAL.F0004_NOT_IMPLEMENTED_ERROR, 'Not implemented exception.');
    }
    onPrepare() { }
    onInitialized() { }
    onDestroy() {
        logger_1.logger.warning(`island service shut down`);
    }
    onStarted() { }
    /**
     * @returns {Promise<void>}
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.onPrepare();
                yield Promise.all(_.values(this.adapters).map(adapter => adapter.initialize()));
                process.once('SIGTERM', this.destroy.bind(this));
                di_bind_1.bindImpliedServices(this.adapters);
                yield this.onInitialized();
                const adapters = _.values(this.adapters)
                    .filter(adapter => adapter instanceof listenable_adapter_1.default);
                yield Promise.all(adapters.map(adapter => adapter.postInitialize()));
                yield Promise.all(adapters.map(adapter => adapter.listen()));
                if (status_exporter_1.STATUS_EXPORT) {
                    logger_1.logger.notice('INSTANCE STATUS SAVE START');
                    interval_helper_1.IntervalHelper.setIslandInterval(status_exporter_1.exporter.saveStatusJsonFile, status_exporter_1.STATUS_EXPORT_TIME_MS);
                }
                logger_1.logger.info('started');
                yield this.onStarted();
            }
            catch (e) {
                console.log('failed to initialize', e);
                process.exit(1);
            }
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('Waiting for process to end');
            yield Promise.all(_.map(this.listenAdapters, (adapter, key) => __awaiter(this, void 0, void 0, function* () {
                logger_1.logger.debug('destroy : ', key);
                yield adapter.destroy();
            })));
            yield interval_helper_1.IntervalHelper.purge();
            yield Promise.all(_.map(this.baseAdapters, (adapter, key) => __awaiter(this, void 0, void 0, function* () {
                logger_1.logger.debug('destroy : ', key);
                yield adapter.destroy();
            })));
            yield this.onDestroy();
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Islet;
//# sourceMappingURL=islet.js.map