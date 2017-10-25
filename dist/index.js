"use strict";
// tslint:disable-next-line
require('source-map-support').install();
require('dns-consul');
const cls = require("continuation-local-storage");
const ns = cls.getNamespace('app') || cls.createNamespace('app');
// tslint:disable
require('cls-mongoose')(ns);
require('cls-bluebird')(ns);
// tslint:enable
exports.mongoose = require("mongoose");
exports.mongoose.Promise = Promise;
const islet_1 = require("./islet");
exports.Islet = islet_1.default;
// adapters
var abstract_adapter_1 = require("./adapters/abstract-adapter");
exports.AbstractAdapter = abstract_adapter_1.default;
var listenable_adapter_1 = require("./adapters/listenable-adapter");
exports.ListenableAdapter = listenable_adapter_1.default;
// adapters/impl
var message_broker_adapter_1 = require("./adapters/impl/message-broker-adapter");
exports.MessageBrokerAdapter = message_broker_adapter_1.default;
var mongoose_adapter_1 = require("./adapters/impl/mongoose-adapter");
exports.MongooseAdapter = mongoose_adapter_1.default;
var push_adapter_1 = require("./adapters/impl/push-adapter");
exports.PushAdapter = push_adapter_1.default;
var redis_connection_adapter_1 = require("./adapters/impl/redis-connection-adapter");
exports.RedisConnectionAdapter = redis_connection_adapter_1.default;
var restify_adapter_1 = require("./adapters/impl/restify-adapter");
exports.RestifyAdapter = restify_adapter_1.default;
var rpc_adapter_1 = require("./adapters/impl/rpc-adapter");
exports.RPCAdapter = rpc_adapter_1.default;
var socketio_adapter_1 = require("./adapters/impl/socketio-adapter");
exports.SocketIOAdapter = socketio_adapter_1.default;
var rabbitmq_adapter_1 = require("./adapters/impl/rabbitmq-adapter");
exports.RabbitMqAdapter = rabbitmq_adapter_1.default;
var amqp_channel_pool_adapter_1 = require("./adapters/impl/amqp-channel-pool-adapter");
exports.AmqpChannelPoolAdapter = amqp_channel_pool_adapter_1.AmqpChannelPoolAdapter;
var event_adapter_1 = require("./adapters/impl/event-adapter");
exports.EventAdapter = event_adapter_1.EventAdapter;
// controllers
var abstract_controller_1 = require("./controllers/abstract-controller");
exports.AbstractController = abstract_controller_1.default;
var endpoint_decorator_1 = require("./controllers/endpoint-decorator");
exports.validate = endpoint_decorator_1.validate;
exports.sanitize = endpoint_decorator_1.sanitize;
exports.admin = endpoint_decorator_1.admin;
exports.extra = endpoint_decorator_1.extra;
exports.auth = endpoint_decorator_1.auth;
exports.devonly = endpoint_decorator_1.devonly;
exports.mangle = endpoint_decorator_1.mangle;
exports.nosession = endpoint_decorator_1.nosession;
exports.ensure = endpoint_decorator_1.ensure;
exports.EnsureOptions = endpoint_decorator_1.EnsureOptions;
exports.endpoint = endpoint_decorator_1.endpoint;
exports.endpointController = endpoint_decorator_1.endpointController;
var rpc_decorator_1 = require("./controllers/rpc-decorator");
exports.rpc = rpc_decorator_1.rpc;
exports.rpcController = rpc_decorator_1.rpcController;
var middleware_decorator_1 = require("./controllers/middleware-decorator");
exports.Response = middleware_decorator_1.Response;
exports.middleware = middleware_decorator_1.middleware;
var event_decorator_1 = require("./controllers/event-decorator");
exports.eventController = event_decorator_1.eventController;
exports.subscribeEvent = event_decorator_1.subscribeEvent;
exports.subscribePattern = event_decorator_1.subscribePattern;
// models
/**
 * @deprecated
 */
var model_factory_1 = require("./models/model-factory");
exports.ModelFactory = model_factory_1.default;
// services
var message_broker_service_1 = require("./services/message-broker-service");
exports.MessageBrokerService = message_broker_service_1.default;
var push_service_1 = require("./services/push-service");
exports.PushService = push_service_1.default;
exports.BroadcastTargets = push_service_1.BroadcastTargets;
var rpc_service_1 = require("./services/rpc-service");
exports.RPCService = rpc_service_1.default;
exports.RpcHookType = rpc_service_1.RpcHookType;
var abstract_broker_service_1 = require("./services/abstract-broker-service");
exports.AbstractBrokerService = abstract_broker_service_1.default;
var amqp_channel_pool_service_1 = require("./services/amqp-channel-pool-service");
exports.AmqpChannelPoolService = amqp_channel_pool_service_1.AmqpChannelPoolService;
var event_service_1 = require("./services/event-service");
exports.EventService = event_service_1.EventService;
var event_subscriber_1 = require("./services/event-subscriber");
exports.BaseEvent = event_subscriber_1.BaseEvent;
// utils
var tracelog_1 = require("./utils/tracelog");
exports.TraceLog = tracelog_1.TraceLog;
var scope_exit_1 = require("./utils/scope-exit");
exports.ScopeExit = scope_exit_1.ScopeExit;
var resource_push_1 = require("./utils/resource-push");
exports.ResourcePush = resource_push_1.ResourcePush;
var msgpack_1 = require("./utils/msgpack");
exports.MessagePack = msgpack_1.default;
var staticdata_loader_1 = require("./utils/staticdata-loader");
exports.StaticDataLoader = staticdata_loader_1.default;
var staticdata_factory_1 = require("./utils/staticdata-factory");
exports.StaticDataFactory = staticdata_factory_1.default;
var jasmine_async_support_1 = require("./utils/jasmine-async-support");
exports.spec = jasmine_async_support_1.jasmineAsyncAdapter;
exports.spyAll = jasmine_async_support_1.createSpyObjWithAllMethods;
exports.resetCallsCount = jasmine_async_support_1.resetSpyObjWithCallsCount;
var error_1 = require("./utils/error");
exports.AbstractError = error_1.AbstractError;
exports.AbstractExpectedError = error_1.AbstractExpectedError;
exports.AbstractFatalError = error_1.AbstractFatalError;
exports.AbstractLogicError = error_1.AbstractLogicError;
exports.ErrorLevel = error_1.ErrorLevel;
exports.IslandLevel = error_1.IslandLevel;
exports.toCode = error_1.toCode;
exports.setIslandCode = error_1.setIslandCode;
var event_1 = require("./utils/event");
exports.Events = event_1.Events;
var interval_helper_1 = require("./utils/interval-helper");
exports.IntervalHelper = interval_helper_1.IntervalHelper;
var status_exporter_1 = require("./utils/status-exporter");
exports.exporter = status_exporter_1.exporter;
var island_di_1 = require("island-di");
exports.Di = island_di_1.Di;
exports.ObjectWrapper = island_di_1.ObjectWrapper;
exports.ObjectFactory = island_di_1.ObjectFactory;
var island_loggers_1 = require("island-loggers");
exports.Loggers = island_loggers_1.Loggers;
//# sourceMappingURL=index.js.map