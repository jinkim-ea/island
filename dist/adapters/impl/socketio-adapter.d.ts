/// <reference types="socket.io" />
import ListenableAdapter from '../listenable-adapter';
export interface SocketIOAdapterOptions {
    port: number;
}
export default class SocketIOAdapter extends ListenableAdapter<SocketIO.Server, SocketIOAdapterOptions> {
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
    /**
     * @override
     * @returns {Promise<void>}
     */
    listen(): Promise<void>;
    destroy(): Promise<any>;
}
