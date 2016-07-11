

var serviceFactories = {}, serviceContainer = {};


function construct(constructor, args) {
    function F() {
        return constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;
    return new F();
}


function createService(ops){
    var depNames = ops.deps, name = ops.name, func = ops.func, deps = [];
    for(var i=0; i<depNames.length; i++){
        deps.push(serviceContainer[depNames[i]]);
    }
    var instance = construct(func, deps);
    return instance;
}


function registerService() {
    var args = Array.prototype.slice.call(arguments);
    var name = args.shift(), callback = args.pop();
    var deps = args;
    var definition = {func: callback, name: name, deps: deps};
    serviceFactories[name] = definition;
    Object.defineProperty(serviceContainer, name, {
        get: function () {
            return serviceContainer[name] = createService(definition);
        }
    });
}


module.exports = {
    services: serviceContainer,
    service: registerService
}