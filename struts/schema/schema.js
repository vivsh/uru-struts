
var types = require("./types"), _ = require("lodash");


function SchemaOptions(schema, meta){
    "use strict";
    this.schema = schema;
    this.options = _.extend({}, meta);
    Object.freeze(this.options);
}

SchemaOptions.prototype = {
    constructor: SchemaOptions,
    select: function (orders) {
        var result = {}, name, i;
        for(i=0; i<orders.length; i++){
            name = orders[i];
            result[name] = this[name];
        }
        result['meta'] = this;
        return Schema(result);
    },
    getTypes: function(){
        "use strict";
        var result = [], key, value, schema = this.schema;
        for(key in schema){
            if(schema.hasOwnProperty(key) && (value = schema[key]) instanceof types.type){
                result.push(value);
            }
        }
        return result;
    },
    extend: function (options) {
        return Schema(this, options);
    }
}

function Schema(){
    var rest = Array.prototype.slice.call(arguments);
    var obj = {}, key, initial, value, i, meta, item, instance;
    for(i=rest.length-1; i>=0; i--){
        item = rest[i];
        if(item.meta){
            meta = item.meta instanceof SchemaOptions ? item.meta.meta : item.meta;
        }
        for(key in item){
            if(!item.hasOwnProperty(key)){
                continue;
            }
            value = item[key];
            initial = obj[key];
            if(key === "meta"){
                continue;
            }
            if(typeof value === 'function' && value.prototype instanceof types.type){
                obj[key] = value
            }else if(value instanceof types.type){
                obj[key] = value;
            }else if(initial){
                delete obj[key];
            }
        }
    }

    var props = {}
    for(key in obj){
        if(obj.hasOwnProperty(key)){
            value = obj[key];
            if(typeof value === 'function'){
                value = new value();
            }else if(Object.isFrozen(value)){
                value = value.copy();
            }
            value.name = key;
            Object.freeze(value);
            props[key] = {
                value: value,
                configurable: false,
                enumerable: true
            }
        }
    }

    instance = Object.create(Schema.prototype, props);
    var meta = new SchemaOptions(instance, meta);

    Object.defineProperty(instance, 'meta', {
        get: function () {
            return meta;
        },
        enumerable: false
    });

    Object.freeze(instance);

    return instance;
}

Schema.prototype = {
    constructor: Schema,
}


module.exports = {
    Schema: Schema
}