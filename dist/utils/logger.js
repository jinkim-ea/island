"use strict";
const island_loggers_1 = require("island-loggers");
exports.logger = island_loggers_1.Loggers.get('island');
island_loggers_1.Loggers.switchLevel('island', process.env.ISLAND_LOGGER_LEVEL || 'info');
//# sourceMappingURL=logger.js.map