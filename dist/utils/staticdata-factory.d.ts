import StaticDataLoader from './staticdata-loader';
/**
 * ModelFactory
 * @class
 */
export default class StaticDataFactory {
    /**
     * Retrieves the wrapped static-data object of given loader.
     *
     * @param Class
     * @returns {any}
     */
    static get<T>(subClass: typeof StaticDataLoader): T;
    private static staticData;
}
