
var store = require("store2"), Silo = require("./silo"), _= require("lodash");


var appRunning = false, appName;

var appDefaults = {};

function Application(options) {
    options = options || {};
    if(appRunning){
        throw new Error("Application is already running")
    }
    appRunning = true;
    appName = options.name;
    _.extend(Application, {
        name: appName,
        store: new Silo(appName),
        settings: _.defaults(options, appDefaults)
    });
}


module.exports = Application