"use strict";
const island_di_1 = require("island-di");
const _ = require("lodash");
const resource_push_1 = require("./resource-push");
const scope_exit_1 = require("./scope-exit");
function bindImpliedServices(adapters) {
    _.forEach(adapters, (adapter, name) => {
        island_di_1.Di.container
            .bindConstant(name, adapter.adaptee)
            .bindConstant(adapter.adaptee.constructor, adapter.adaptee);
    });
    island_di_1.Di.container
        .bindScopeResource(scope_exit_1.ScopeExit, service => service.disposer())
        .bindScopeResource(resource_push_1.ResourcePush, service => service.disposer());
}
exports.bindImpliedServices = bindImpliedServices;
//# sourceMappingURL=di-bind.js.map