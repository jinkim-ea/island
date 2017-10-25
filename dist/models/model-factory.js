"use strict";
/**
 * ModelFactory
 * @class
 * @deprecated
 */
class ModelFactory {
    static get(subClass) {
        const name = subClass.prototype.constructor.name;
        let instance = this.models[name];
        if (!instance) {
            this.models[name] = instance = new subClass();
            return instance;
        }
        return instance;
    }
}
ModelFactory.models = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ModelFactory;
//# sourceMappingURL=model-factory.js.map