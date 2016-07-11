

var _ = require("lodash"),
    u = require("uru"),
    routes = require("./routes"),
    Silo = require("./silo"),
    $ = require("jquery");


var appReady = false, appConfigured = false, appReadyCallbacks = [];


var defaults = {
    name: "",
    loginUrl: "login",
    logoutUrl: "logout",
    staticUrl: "/static/",
    mediaUrl: "/media/",
    loginRedirectUrl: "home",
    logoutRedirectUrl: "home",
};

var appContext = {};

var settings = {

};

var services = {

};

function renderDom() {
    if(settings.router){
        if(!settings.container){
            throw new Error("No page container specified");
        }
        u.mount(u(settings.router), document.getElementById(settings.container));
    }
    u.automount();
    u.dom.ready(function () {
        routes.mount();
        appReady = true;
        while(appReadyCallbacks.length){
            appReadyCallbacks.shift()();
        }
    });
}

function loadContext(loaders, func){
    "use strict";
    var when = [], deferred, count = 0;;
    _.extend(appContext, global.URU_APP_CONTEXT);
    _.each(loaders, function (value, key) {
        if(_.isString(value)){
            deferred = $.getJSON(value);
        }else{
            deferred = value();
        }
        if(deferred && deferred.then){
            count+=1;
            when.push(deferred);
            deferred.done(function (data) {
                appContext[key] = data;
            }).always(function () {
                count--;
                if(count===0){
                    func();
                }
            })
        }else{
            appContext[key] = deferred;
        }
    });
    if(count===0){
        func();
    }
}

function strutsSetup(options) {
    if(appConfigured){
       throw new Error("Already configured");
    }
    _.defaultsDeep(settings, options, defaults);
    services.store = new Silo(settings.name);
    if(Object.freeze){
        Object.freeze(settings);
        Object.freeze(services);
    }
    var loaders = settings.loaders;
    loadContext(loaders, renderDom);
    appConfigured = true;
}


function strutsReady(func){
    if(appReady){
        func();
    }else{
        appReadyCallbacks.push(func);
    }
}

function staticUrl(relativePath) {
    return settings.staticUrl + relativePath;
}

function mediaUrl(relativePath) {
    return settings.staticUrl + relativePath;
}

module.exports = {
    settings: settings,
    services: services,
    setup: strutsSetup,
    ready: strutsReady,
    static: staticUrl,
    media: mediaUrl,
    context: appContext
}