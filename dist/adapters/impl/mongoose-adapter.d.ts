/// <reference types="mongoose" />
import * as mongoose from 'mongoose';
import AbstractAdapter from '../abstract-adapter';
export interface MongooseAdapterOptions {
    uri: string;
    connectionOptions?: mongoose.ConnectionOptions;
}
/**
 * MongooseAdapter
 * @class
 * @extends AbstractAdapter
 */
export default class MongooseAdapter extends AbstractAdapter<mongoose.Connection, MongooseAdapterOptions> {
    /**
     * Initialize the mongoose connection.
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    private dnsLookup(uri);
    private convert(host);
}
