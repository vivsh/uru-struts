
var _ = require("lodash"),
    moment = require("moment"),
    errors = require("./errors"),
    fields = require("./fields");


function Type(options){
    "use strict";
    if(options instanceof Type){
        if(options.constructor !== this.constructor){
            throw new Error("Cannot copy instance of a different constructor");
            options = options.options;
        }
    }
    this.initialize.apply(this, arguments);
}

Type.prototype = {
    constructor: Type,
    isEmpty: function(value){
        return value == null || value === '' || (_.isArray(value) && value.length == 0);
    },
    getDefaults: function(){
        return {required: true, default: null};
    },
    initialize: function(options){
        var options = _.extend({}, this.getDefaults(), options);
        options.required = !! options.required;
        Object.freeze(options);
        this.options = options;
    },
    toJS: function(value){
        return value;
    },
    toJSON: function(value){
        return value;
    },
    toQuery: function(value){
        return this.toJSON(value);
    },
    validateChoice: function(value){
        var ops = this.options;
        if(ops.choices){
            var choices = ops.choices, i;
            for(i=0; i< choices.length; i++){
                if(choices[i].value == value){
                    return;
                }
            }
            if(i){
                throw new errors.ValidationError("Invalid choice", "choice", this.name);
            }
        }
    },
    validateMultipleChoice: function(values){
        "use strict";
        var ops = this.options, i;
        for(i=0; i<values.length; i++){
            this.validateChoice(values[i]);
        }
    },
    coerce: function(value){
        var ops = this.options;
        if(this.isEmpty(value)){
            value = ops.default;
        }
        if(!this.isEmpty(value)){
            return this.toJS(value);
        }
        return value;
    },
    validate: function(value, data){
        var ops = this.options;
        if (this.isEmpty(value) && ops.required) {
            throw new errors.ValidationError("This field is required", "required");
        }
        if (_.isArray(value)) {
            this.validateMultipleChoice(value);
        }else {
            this.validateChoice(value);
        }
        var validators = ops.validators, i;
        if(validators && validators.length){
            for(i=0; i< validators.length; i++){
                validators[i](value, data);
            }
        }
    },
    messages: function(){
        "use strict";
        return this.options.messages || {};
    },
    update: function(options){
        options = _.extend({}, this.options, options);
        return new this.constructor(options);
    },
    copy: function(){
        return new this.constructor(this.options);
    }
}

Type.extend = function extendType(methods) {
    var parent = this;
    var constructor = function SubType(options) {
        if(!this || !(this instanceof SubType)){
            return new SubType(options);
        }
        parent.apply(this, arguments);
    }
    var prototype = constructor.prototype = Object.create(parent.prototype);
    prototype.constructor = constructor;
    _.extend(prototype, methods);
    constructor.extend = extendType;
    Object.freeze(prototype);
    return constructor;
}


var ListType = Type.extend({
    initialize: function(base, options){
        this.base = base;
        this.constructor.prototype.initialize.call(this, options);
    },
    toJS: function(values){
        var result = [], i, base = this.base;
        for(i=0;i<values.length;i++){
            result.push(base.toJS(values[i]));
        }
        return result;
    },
    toJS: function(values){
        var result = [], i, base = this.base;
        for(i=0;i<values.length;i++){
            result.push(base.toJSON(values[i]));
        }
        return result;
    },
    toQuery: function(values){
        var result = [], i, base = this.base;
        for(i=0;i<values.length;i++){
            result.push(base.toQuery(values[i]));
        }
        return result;
    }
});

var IntType = Type.extend({
    toJS: function(value){
        var result = parseInt(value);
        if(typeof result != "number" || isNaN(result)){
            throw new errors.ValidationError("Invalid value: "+ value);
        }
        return result;
    },
    validate: function(value){
        Type.prototype.validate.call(this, value);
        var ops = this.options;
        if(ops.max && ops.max <= value){
            throw new errors.ValidationError("Value should be less than "+ops.max, "max-value");
        }
        if(ops.min && ops.min >= value){
            throw new errors.ValidationError("Value should be more than "+ops.min, "min-value");
        }
    }
});



var IntChoiceType = Type.extend({
    toJS: function(values){
        "use strict";
        var i, result = [];
        for(i=0;i<values.length;i++){
            result.push(parseInt(values[i]));
        }
        return result;
    }
});

var BoolType = Type.extend({
    toJS: function(value){
        if(typeof value === 'string'){
            return value == "true" || value == "yes" || value == "on";
        }
        return !!value;
    }
});


var StrType = Type.extend({
    toJS: function(value){
        return String(value);
    }
});


var FloatType = Type.extend({
    toJS: function(value){
        return parseFloat(value);
    }
});


var DateType = Type.extend({
    toJS: function(value){
        if(value instanceof Date){
            return value;
        }
        return moment(value, this.options.inputFormat);
    }
});


module.exports = {
    'type': Type,
    'integer': IntType,
    'string': StrType,
    'float': FloatType,
    'boolean': BoolType,
    'list': ListType,
    'datetime': DateType
}
