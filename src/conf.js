

var _ = require("lodash"),
    u = require("uru"),
    routes = require("./routes"),
    Silo = require("./silo");


var appReady = false, appConfigured = false, appReadyCallbacks = [];


var defaults = {
    name: "",
    root: ""
};

var settings = {

};

var services = {

};


function strutsSetup(options) {
    if(appConfigured){
       throw new Error("Already configured");
    }
    _.defaultsDeep(settings, options, defaults);
    services.store = new Silo(settings.name);
    u.automount();
    u.dom.ready(function () {
        routes.mount();
        appReady = true;
        while(appReadyCallbacks.length){
            appReadyCallbacks.shift()();
        }
    });
    appConfigured = true;
}


function strutsReady(func){
    console.log("***********");
    if(appReady){
        func();
    }else{
        appReadyCallbacks.push(func);
    }
}


module.exports = {
    settings: settings,
    services: services,
    setup: strutsSetup,
    ready: strutsReady
}