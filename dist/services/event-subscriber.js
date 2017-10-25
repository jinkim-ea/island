"use strict";
class BaseEvent {
    constructor(key, args) {
        this.key = key;
        this.args = args;
    }
}
exports.BaseEvent = BaseEvent;
class DebugBaseEvent {
    constructor(key, args, publishedAt) {
        this.key = key;
        this.args = args;
        this.publishedAt = publishedAt;
    }
}
exports.DebugBaseEvent = DebugBaseEvent;
class DebugEvent extends DebugBaseEvent {
    constructor(debugClass, publishedAt) {
        super(debugClass.key, debugClass.args, publishedAt);
        this.debugClass = debugClass;
        this.publishedAt = publishedAt;
    }
}
exports.DebugEvent = DebugEvent;
class Subscriber {
}
exports.Subscriber = Subscriber;
class EventSubscriber extends Subscriber {
    constructor(handler, eventClass) {
        super();
        this.handler = handler;
        this.eventClass = eventClass;
        const event = new eventClass(null);
        this.key = event.key;
    }
    getQueue() {
        return this.queue;
    }
    setQueue(queue) {
        this.queue = queue;
    }
    getRoutingPattern() {
        return this.key;
    }
    get routingKey() {
        return this.key;
    }
    isRoutingKeyMatched(routingKey) {
        return routingKey === this.key;
    }
    handleEvent(content, msg) {
        const event = new this.eventClass(content);
        event.publishedAt = new Date(msg.properties.timestamp || 0);
        return Promise.resolve(this.handler(event));
    }
}
exports.EventSubscriber = EventSubscriber;
class PatternSubscriber extends Subscriber {
    constructor(handler, pattern) {
        super();
        this.handler = handler;
        this.pattern = pattern;
        this.regExp = this.convertRoutingKeyPatternToRegexp(pattern);
    }
    getQueue() {
        return this.queue;
    }
    setQueue(queue) {
        this.queue = queue;
    }
    getRoutingPattern() {
        return this.pattern;
    }
    isRoutingKeyMatched(routingKey) {
        return this.regExp.test(routingKey);
    }
    handleEvent(content, msg) {
        return Promise.resolve(this.handler({
            args: content,
            key: msg.fields.routingKey,
            publishedAt: new Date(msg.properties.timestamp || 0)
        }));
    }
    convertRoutingKeyPatternToRegexp(pattern) {
        const regexPattern = pattern
            .replace('.', '\\.') // dot(.) is separator
            .replace('*', '\\w+') // star(*) means one word exactly
            .replace('#', '[\\w\\.]*'); // hash(#) means zero or more words, including dot(.)
        return new RegExp(`^${regexPattern}$`);
    }
}
exports.PatternSubscriber = PatternSubscriber;
//# sourceMappingURL=event-subscriber.js.map