"use strict";
const island_loggers_1 = require("island-loggers");
const event_subscriber_1 = require("../services/event-subscriber");
var Events;
(function (Events) {
    class LoggerLevelChanged extends event_subscriber_1.BaseEvent {
        constructor(args) {
            super('logger.level.changed', args);
        }
    }
    Events.LoggerLevelChanged = LoggerLevelChanged;
    class LoggerTypeChanged extends event_subscriber_1.BaseEvent {
        constructor(args) {
            super('logger.type.changed', args);
        }
    }
    Events.LoggerTypeChanged = LoggerTypeChanged;
    class SystemNodeStarted extends event_subscriber_1.BaseEvent {
        constructor(args) {
            super('system.node.started', args);
        }
    }
    Events.SystemNodeStarted = SystemNodeStarted;
})(Events = exports.Events || (exports.Events = {}));
exports.DEFAULT_SUBSCRIPTIONS = [{
        eventClass: Events.LoggerLevelChanged,
        handler: (event) => island_loggers_1.Loggers.switchLevel(event.args.category, event.args.level),
        options: { everyNodeListen: true }
    }, {
        eventClass: Events.LoggerTypeChanged,
        handler: (event) => island_loggers_1.Loggers.switchType(event.args.type),
        options: { everyNodeListen: true }
    }
];
//# sourceMappingURL=event.js.map