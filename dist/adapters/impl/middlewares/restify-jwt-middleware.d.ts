import restify = require('restify');
export interface IToken {
    sid: string;
    aid?: string;
    aname?: string;
    publisher: string;
}
/**
 * Check the HTTP authorization header, then parse only if the header is a bearer JWT token.
 * @param {{secret: string}} options
 * @return {RequestHandler}
 */
export default function jwtParser(options: {
    secret: string;
}): restify.RequestHandler;
