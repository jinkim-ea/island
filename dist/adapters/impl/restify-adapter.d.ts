import * as restify from 'restify';
import ListenableAdapter from '../listenable-adapter';
export interface RestifyAdapterOptions {
    serverOptions?: restify.ServerOptions;
    port: number;
}
/**
 * RestifyAdapter
 * @class
 * @extends ListenableAdapter
 */
export default class RestifyAdapter extends ListenableAdapter<restify.Server, RestifyAdapterOptions> {
    /**
     * Initialize the restify server.
     * @override
     * @returns {Promise<void>}
     */
    initialize(): void;
    /**
     * Listen the restify server.
     * @override
     * @returns {Promise<void>}
     */
    listen(): Promise<void>;
    destroy(): Promise<any>;
}
