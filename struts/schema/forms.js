
var errors = require("./errors"),
    _ = require("lodash"),
    fields = require("./fields");


var ValidationError = errors.ValidationError;
var ErrorDict = errors.ErrorDict;

function FormMeta(form){
    "use strict";
    this.form = form;
}

FormMeta.prototype = {
    constructor: FormMeta,
    getFields: function(){
        var key, value, form = this.form, result = [];
        for(key in form){
            if(form.hasOwnProperty(key) && (value = form[key]) instanceof fields.FormField){
                result.push(value);
            }
        }
        return result;
    },
    getHiddenFields: function(){
        return _.filter(this.fields, function (f) {
            return f.hidden;
        })
    },
    getVisibleFields: function(){
        return _.filter(this.fields, function (f) {
            return !f.hidden;
        });
    },
    isMultipart: function(){
        return _.some(this.fields, function (f) {
            return f.multipart;
        })
    }
}


function Form(options){
    "use strict";
        this._silent = true;
        this._cleanedData = {};
        this._dirty = true;
        this._errors = null;
        this._data = {};
        this.setOptions(options);
        var schema = this.getSchema();
        var meta = schema.meta;
        var types = meta.types, i, type;
        var messages = _.merge({}, {validation: {}}, meta.options.messages, this.options.messages);
        for(i=0; i<types.length; i++){
            type = types[i];
            Object.defineProperty(this, type.name, {
                value: new fields.FormField(type, this),
                configurable: false,
                enumerable: true
            });
        }
        Object.defineProperty(this, "meta", {
            value: new FormMeta(this),
            configurable: false,
            enumerable: false
        });
        Object.defineProperty(this, "messages", {
            value: messages,
            enumerable: false,
            configurable:false
        });
}

Form.prototype = {
    constructor: Form,

}
Form.prototype = {
    constructor: Form,
    getDefaults: function(){
        return {};
    },
    setOptions: function(options){
        this.options = _.extend({}, this.getDefaults(), options);
    },
    getSchema: function(){
        return this.options.schema;
    },
    get: function(name){
        return this.cleanedData[name];
    },
    set: function(data){
        _.extend(this._data, data);
        this._dirty = true;
    },
    isSilent: function(){
        return this._silent;
    },
    setSilent: function(value){
        this._silent = !!value;
        _.each(this.meta.fields, function (f) {
            f.silent = !!value;
        })
    },
    isDirty: function(){
        return this._dirty;
    },
    getData: function(){
        return this._data;
    },
    getCleanedData: function(){
        this.errors;
        return this._cleanedData;
    },
    getErrors: function(){
        if(this._dirty){
            this._fullClean();
        }
        return this._errors;
    },
    toQuery: function(){
        var data = this.cleanedData, key, value, field, result = {};
        for(key in data){
            if(data.hasOwnProperty(key) && (field = this[key])){
                value = data[key];
                result[key] = field.type.toQuery(value);
            }
        }
        return key;
    },
    toJSON: function(){
        var data = this.cleanedData, key, value, field, result = {};
        for(key in data){
            if(data.hasOwnProperty(key) && (field = this[key])){
                value = data[key];
                result[key] = field.type.toJSON(value);
            }
        }
        return key;
    },
    isValid: function(){
        return this.errors.length === 0;
    },
    _fullClean: function(){
        var errors = new ErrorDict(this), data = this._data, result = this._cleanedData = {}, self = this;
        var fields = this.meta.fields, i, field, value, e, type, name, key;
        for(i=0; i< fields.length; i++){
            field = fields[i];
            type = field.type;
            name = type.name;
            e = ValidationError.capture(function(){
                result[name] = type.clean(data[name]);
            });
            if(e){
                errors.add(e, name);
            }
        }
        for(name in result){
            if(!result.hasOwnProperty(name)){
                continue;
            }
            value = result[name];
            field = this[name];
            type = field.type;
            e = ValidationError.capture(
                function(){
                    type.validate(value, result);
                }, 
                function () {
                   var method = "validate" + _.upperFirst(name);
                    if(self[method]){
                        self[method](value, result);
                    }
                }
            );
            if(e){
                errors.add(e, name);
                delete result[name];
            }
        }

        e = ValidationError.capture(function () {
            self._cleanedData = result = self.clean(result);
        });
        if(e){
            errors.add(e);
        }
        this._errors = errors;
        this._dirty = false;
    },
    clean: function(value){
        return value
    }

}

module.exports = {
    Form: Form,
}