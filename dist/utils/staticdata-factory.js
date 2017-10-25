"use strict";
/**
 * ModelFactory
 * @class
 */
class StaticDataFactory {
    /**
     * Retrieves the wrapped static-data object of given loader.
     *
     * @param Class
     * @returns {any}
     */
    static get(subClass) {
        const name = subClass.prototype.constructor.name;
        let instance = this.staticData[name];
        if (!instance) {
            this.staticData[name] = instance = new subClass();
            instance.initialize();
        }
        return instance.Object;
    }
}
StaticDataFactory.staticData = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StaticDataFactory;
//# sourceMappingURL=staticdata-factory.js.map