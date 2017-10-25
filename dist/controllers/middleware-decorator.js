"use strict";
const Bluebird = require("bluebird");
const events = require("events");
class Response extends events.EventEmitter {
    set statusCode(code) { this._statusCode = code; }
    get statusCode() { return this._statusCode; }
    get body() { return this._body; }
    get url() { return this._url; }
    end(body) {
        this._body = (typeof body === 'string') ? JSON.parse(body) : body;
        // NOTE: 'end' 가 이미 사용중인 것 같다. 사용되지 않을 것 같은 xxx로 사용
        this.emit('xxx', body);
    }
    redirect(url) {
        this._url = url;
    }
    setHeader(key, value) {
        // TODO
    }
}
exports.Response = Response;
function middleware(...middlewares) {
    return (target, key, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = (...args) => {
            const { req, res } = { req: args[0], res: new Response() };
            const promises = middlewares.map(middleware => {
                return (req, res) => {
                    return new Promise((resolve, reject) => {
                        res.once('xxx', body => resolve());
                        middleware(req, res, err => {
                            if (err)
                                return reject(err);
                            res.removeAllListeners('xxx');
                            resolve();
                        });
                    });
                };
            });
            return Bluebird.reduce(promises, (total, current) => current(req, res), promises[0])
                .then(() => args[args.length] = res)
                .then(() => originalMethod.apply(this, args))
                .catch(err => Promise.reject(err));
        };
    };
}
exports.middleware = middleware;
//# sourceMappingURL=middleware-decorator.js.map