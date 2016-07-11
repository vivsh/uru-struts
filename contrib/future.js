
var _ = require("lodash"), 
    router = require("../struts/router"), 
    u = require("uru"),
    types = require("../struts/schema/types"),
    Schema = require("../struts/schema/schema").Schema;
    models = require("../struts/schema/models");


function component(options){
    "use strict";
    return function componentDecorator(target) {
        _.extend(target.prototype, options);
        u.component(options.name, target);
    }
}


function schema(options){
    "use strict";
    return function schemaDecorator(target){
        var parents = [options], p = Object.getPrototypeOf(target);
        while(p.prototype && p.prototype.schema instanceof Schema){
            parents.push(p.prototype.schema);
            p = Object.getPrototypeOf(p);
        }
        target.prototype.schema = Schema.apply(null, parents);
    }
}

function mixin(){
    "use strict";
    var objects = Array.prototype.slice.call(arguments);
    return function mixinDecorator(target) {
        var i;
        for(i=0; i< objects.length; i++){
            _.extend(target.prototype, objects[i]);
        }
    }
}

module.exports = {
    types: types,
    component: component,
    Component: u.Component,
    Page: router.Page,
    schema: schema,
    Model: models.Model,
    mixin: mixin
}