import { IToken } from './restify-jwt-middleware';
export { IToken };
export interface ISession {
    sid: string;
    aid: string;
    aname?: string;
    current?: {
        pid: string;
    };
    publisher: string;
    nx?: {
        accountid: string;
        nexonid: string;
        channelinguid: string;
        cc: string;
    };
    tc?: {
        qqid: number;
        fatiguerate: number;
    };
}
export interface ISessionStore {
    getSession(sid: string): Promise<ISession>;
    setSession(sid: string, session: ISession): Promise<ISession>;
    deleteSession(sid: string): Promise<void>;
}
