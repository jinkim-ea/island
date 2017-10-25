import AbstractController from '../controllers/abstract-controller';
import AbstractAdapter, { IAbstractAdapter } from './abstract-adapter';
/**
 * IListenableAdapter
 * @interface
 */
export interface IListenableAdapter extends IAbstractAdapter {
    postInitialize(): any | Promise<any>;
    listen(): any | Promise<any>;
}
/**
 * Abstract adapter class for back-end service.
 * @abstract
 * @class
 * @extends AbstractAdapter
 * @implements IListenableAdapter
 */
export default class ListenableAdapter<T, U> extends AbstractAdapter<T, U> implements IListenableAdapter {
    private _controllersClasses;
    private _controllers;
    /**
     * @param {AbstractController} Class
     */
    registerController(Class: typeof AbstractController): void;
    /**
     * @returns {Promise<void>}
     * @final
     */
    postInitialize(): Promise<any>;
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    listen(): any | Promise<any>;
    destroy(): Promise<any>;
}
