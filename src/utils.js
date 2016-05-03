
var URI = require("urijs");


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


function isEqual(first, second){
    var stack = [{a: first, b: second}], typeA, typeB, a , b, item, i, k, v, history, l;
    if(first === second){
        return true;
    }
    while(stack.length){
        item = stack.shift();
        a = item.a;
        b = item.b;
        typeA = typeof item.a;
        typeB = typeof item.b;
        if(a===b){

        }else if(typeA != typeB){
            return false;
        }else if(typeA != 'object'){
            return false;
        }else if(a == null || b == null){
            return false;
        }else if(a.constructor !== b.constructor){
            return false;
        }else if(Object.prototype.toString.call(a) === '[object Array]'){
            l = Math.max(a.length, b.length);
            for(i=0; i< l; i++){
                stack.push({
                    a: a[i],
                    b: b[i]
                });
            }
        }else{
            history = {};
            for(k in a){
                if(a.hasOwnProperty(k)){
                    stack.push({
                        a: a[k],
                        b: b[k]
                    })
                    history[k] = 1;
                }
            }
            for(k in b){
                if(b.hasOwnProperty(k) && !(k in history)){
                    stack.push({
                        a: a[k],
                        b: b[k]
                    });
                }
            }
        }
    }
    return true;
}



module.exports = {
    buildUri: buildUri,
    parseUri: parseUri,
    beanify: beanify,
    isEqual: isEqual
}
