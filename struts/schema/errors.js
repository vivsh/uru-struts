

var _ = require("lodash");



function ValidationError(message, code){
    if(arguments.length==1){
        code = "invalid";
    }
    if(!this || !(this instanceof ValidationError)){
        return new ValidationError(message, code);
    }
    this.code = code;
    this.data = message;
}

ValidationError.prototype.hasMany = function isErrorSingle() {
    return !_.isString(this.data);
}

ValidationError.capture = function captureValidationError() {
    var callbacks = Array.prototype.slice.call(arguments);
    var i;
    try{
        for(i=0; i< callbacks.length; i++){
            callbacks[i]();
        }
    }catch(e){
        if(e instanceof ValidationError){
            return e;
        }
        throw e;
    }
}

function ErrorDict(form){
    "use strict";
        this._errors = {};
        this._size = 0;
        this.form = form;
};

ErrorDict.prototype = {
    constructor: ErrorDict,
    all: function () {
        return _.extend({}, this._errors);
    },
    size: function(){
        return this._size;
    },
    format: function(message, name, code){
        var form = this.form, field = form[name], formErrorMessages = form.messages.validation,
            fieldErrorMessages = field ? field.messages : {};
        if(!code){
            return message;
        }
        var msg = _.get(formErrorMessages, name + "." + code);
        if(!msg){
            msg = _.get(fieldErrorMessages, code);
        }
        return msg || message;
    },
    add: function(error, name){
        var nonFieldError = '__all__';
        var stack = [{error: error, name: name}], item, errors = this._errors, size = 0, content, form = this.form;
        while (stack.length){
            item = stack.shift();
            if(item.error instanceof ValidationError && item.error.hasMany()){
               _.each(item.error.data, function (err, key) {
                   console.log(err, key);
                    stack.push({name: key, error:err})
               });
            }else if(item.name){
                content = item.error instanceof ValidationError ? item.error.data : String(item.error);
                if(content instanceof ValidationError){
                    stack.unshift({name: item.name, error: content});
                }else if(item.name != nonFieldError && (!form[item.name] || form[item.name].hidden)){
                    stack.unshift({name: nonFieldError, error: content});
                }else{
                    if(!(item.name in errors)){
                        errors[item.name] = [];
                    }
                    errors[item.name].push(this.format(content, item.name, item.error.code));
                    size ++;
                }
            }else{
                stack.unshift({name: nonFieldError, error: item.error})
            }
        }
    }
}


module.exports = {
    ValidationError: ValidationError,
    ErrorDict: ErrorDict
}