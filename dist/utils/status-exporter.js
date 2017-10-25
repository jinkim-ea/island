"use strict";
const island_status_exporter_1 = require("island-status-exporter");
exports.STATUS_EXPORT = process.env.STATUS_EXPORT === 'true';
exports.STATUS_EXPORT_TIME_MS = parseInt(process.env.STATUS_EXPORT_TIME_MS, 10) || 10 * 1000;
const STATUS_FILE_NAME = process.env.STATUS_FILE_NAME;
const HOST_NAME = process.env.HOSTNAME;
const SERVICE_NAME = process.env.SERVICE_NAME;
if (exports.STATUS_EXPORT)
    island_status_exporter_1.StatusExporter.initialize({ name: STATUS_FILE_NAME, hostname: HOST_NAME, servicename: SERVICE_NAME });
exports.exporter = island_status_exporter_1.StatusExporter;
//# sourceMappingURL=status-exporter.js.map