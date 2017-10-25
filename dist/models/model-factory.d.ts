/**
 * ModelFactory
 * @class
 * @deprecated
 */
export default class ModelFactory {
    /**
     * Retrieves the model of given type.
     * @param {any} Class
     * @returns {any}
     */
    static get<T>(subClass: any): T;
    static get(subClass: any): any;
    private static models;
}
