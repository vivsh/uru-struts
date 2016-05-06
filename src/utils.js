
var URI = require("urijs"), u = require("uru");


function parseUri(url){
    "use strict";
    var uri = URI(url);
    return {
        path: uri.path(),
        query: uri.search(true),
        protocol: uri.protocol(),
        hostname: uri.hostname(),
        port: uri.port()
    };
}


function buildUri(values){
    "use strict";
    return URI(values.path)
        .hostname(values.hostname||"")
        .port(values.port)
        .query(values.query).toString();
}


function makeGetter(key){
    return function(){ return this[key]();};
}


function makeSetter(key) {
    return function(value){ this[key](value); };
}


function beanify(factory, propertyNames){
    "use strict";
    var prototype = factory.prototype,
        props = {}, value, match, name, prop,
        getter = /(get)([A-Z])(\w*)/, setter = /(set)([A-Z])(\w*)/, tester = /(has|is)([A-Z])(\w+)/,
        count = 0;
    for(var key in prototype){
        value = prototype[key]
        if(typeof value === 'function' && (match = getter.exec(key) || setter.exec(key) || tester.exec(key))){
            name = match[2].toLowerCase() + match[3];
            if(name in prototype){
                continue;
            }
            if(propertyNames && propertyNames.indexOf(name) < 0){
                continue;
            }
            if(!(name in props)){
                props[name] = {};
            }
            prop = props[name];
            if(match[1] in {get:1, is:1, has: 1} && value.length === 0){
                prop['get'] = makeGetter(key);
                count++;
            }else if(match[1] === 'set' && value.length === 1){
                prop['set'] = makeSetter(key);
                count++;
            }
        }
    }
    if(count){
        Object.defineProperties(prototype, props);
    }
}


module.exports = {
    buildUri: buildUri,
    parseUri: parseUri,
    beanify: beanify,
    isEqual: u.utils.isEqual
}
