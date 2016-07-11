var u = require("uru"),
    _ = require("lodash"),
    utils = require("./utils"),
    fields = require("./fields"),
    http = require("./http"),
    routes = require("./routes"),
    URI = require("urijs"),
    fui = require("./fui");

 function validateFieldSet(form, fieldSet, data, validators, errors, next) {
     if(!fieldSet.length){
         if(form.isValid()){
               fields.validateField(data, validators, errors, next);
         }else{
             next(data, errors);
         }
     }else{
         var field = fieldSet.shift();
         var callback = function(){
             if(field.isValid()){
                data[field.name] = field.getValue();
             }
            validateFieldSet(form, fieldSet, data, validators, errors, next);
         };
         field.validate(callback);
     }
 }


function Form(data, options){
    "use strict";
    var fieldset = {}, self = this, field;
    this._nonFieldErrors = [];
    this._validators = this.options.validators ? this.options.validators.slice(0) : [];
    this._validating = false;
    this._data = _.extend({}, this.getQueryDict(), data);
    this._onReadyCallbacks = [];
    this._bound = false;
    this._messages = this.messages || {};
    _.each(this.fields, function (value, key) {
        var options = _.isString(value) ? {type: value} : value;
        options = _.extend({name: key}, options);
        fieldset[options.name] = fields.createField(options);
    });

    this.fields = fieldset;
    this._disabled = false;
    this._setData(this._data);
    this.initialize.apply(this, arguments);
}


Form.extend = function(){
    var class_ = u.utils.extend.apply(this, arguments);
    class_.prototype.messages = _.defaultsDeep({}, class_.prototype.messages, this.prototype.messages);
    class_.prototype.options = _.defaultsDeep({}, class_.prototype.options, this.prototype.options);
    return class_;
}


Form.prototype = {
    constructor: Form,
    initialize: _.noop,
    options:{
        method: "get"
    },
    messages: {
        failure: "There were some errors in the form"
    },
    callWhenReady: function (callback) {
        this._onReadyCallbacks.push(callback);
        if(this.ready){
            this._notifyReady();
        }
    },
    isBound: function(){
        return this._bound;
    },
    setBound: function (bound) {
        this._bound = !!bound;
        _.each(this.getFields(), function (field) {
            field.setBound(bound);
        });
    },
    _setData: function (data, noinitial) {
        var name, value, initial = this.options.initial || {};
        this._data = data;
        _.each(this.getFields(), function (field) {
            name = field.name;
            if(data.hasOwnProperty(name)){
                value = data[name]
                field.setValue(value);
            }else if(!noinitial){
                value = initial.hasOwnProperty(name) ? initial[name] : field.state.initialValue;
                field.setValue(value);
            }
        });
    },
    setData: function (data) {
        this._setData(data);
    },
    getCleanedData: function () {
        var data = {};
        _.each(this.getFields(), function (field) {
            if(field.isValid()){
                data[field.name] = field.getValue();
            }
        });
        return data;
    },
    toJSON: function () {
        var data = {};
        _.each(this.getFields(), function (field) {
            if(field.isValid()){
                data[field.name] = field.toJSON();
            }
        });
        return data;
    },
    toQuery: function () {
        var data = {};
        _.each(this.getFields(), function (field) {
            if(field.isValid() && !field.isEmpty(field.data)){
                data[field.name] = field.toQuery();
            }
        });
        return data;
    },
    parseErrors: function(response){
        var status = response.status, self = this;
        self._nonFieldErrors = [];
        if(status === 400){
            var errors = response.json();
            _.each(errors, function (values, key) {
                var field = self.fields[key];
                if(!_.isArray(values)){
                    values = [values];
                }
                if(field && !field.hidden){
                    _.each(values, function (value) {
                        field.addError(value);
                    })
                }else{
                    _.each(values, function (val) {
                        self.addError({field:key, message: val});
                    })
                }
            });
        }
    },
    getNonFieldErrors: function () {
        "use strict";
        var hidden = [];
        _.each(this.getFields(), function (f) {
            if (f.hidden) {
                var errors = _.map(f.errors, function (err) {
                     return _.extend({}, err, {field: f.name, message: f.name + ": " + err.message});
                });
                hidden.push.apply(hidden, errors);
            }
        });
        return this._nonFieldErrors.concat(hidden);
    },
    getErrors: function () {
        var errors = {};
        errors["__all__"] = this.getNonFieldErrors();
        _.each(this.getFields(), function (field) {
            if(!field.isValid()){
                errors[field.name] = field.getErrors();
            }
        });
        return errors;
    },
    addError: function(error){
        var stack = [error], item, name, field, message, nonFieldErrors = this._nonFieldErrors;
        while (stack.length){
            item = stack.shift();
            if(_.isArray(item)){
                stack.push.apply(stack, item);
                continue;
            }else if(_.isString(item)){
                item = {message: item, field: "__all__"};
            }else if(item instanceof Error){
                item = {message: item.message, field: "__all__", stack: item.stack};
            }
            name = item.field;
            field = name && name != "__all__" ? this.getField(name) : null;
            if(!field){
                message = name ? name + ": " + item.message : item.message;
                item = {field: "__all__", message: message, code: "invalid"};
                nonFieldErrors.push(item);
            }else{
                field.addError(item);
            }
        }
    },
    getField: function (name) {
        return this.fields[name];
    },
    getFields: function () {
        return _.values(this.fields);
    },
    getVisibleFields: function () {
        return _.filter(this.getFields(), function(field){
            return !field.hidden;
        });
    },
    getHiddenFields: function () {
        return _.filter(this.getFields(), function(field){
            return field.hidden;
        });
    },
    getQueryDict: function () {
        return utils.parseUri(location.href).query;
    },
    isValid: function () {
        "use strict";
        return this._nonFieldErrors.length === 0 && _.every(this.getFields(), function (field, name) {
            return field.isValid();
        });
    },
    validate: function (next) {
        if(this._validating){
            this.callWhenReady(next);
        }else{
            this._runValidators(next);
        }
    },
    serialize: function () {
        "use strict";
        console.log("Deprecation Warning: Use buildUri instead");
        return $.param(this.toQuery());
    },
    getEl: function(){
        return this.component.el;
    },
    buildUri: function (baseUrl) {
        return URI(baseUrl || location.href).search(this.toQuery());
    },
    getMessage: function (name, defaultMessage) {
        return _.get(this._messages, name) || defaultMessage;
    },
    getFailureMessage: function () {
        return this.getMessage("failure")
    },
    getValidationMessage: function (fieldName, code, message) {
        var msg = this.getMessage(['fields', fieldName]);
        if(_.isPlainObject(msg)){
            return msg[code] || message;
        }else if(_.isString(msg)){
            return msg;
        }
        return this.getMessage(["codes", code], message);
    },
    clean: function (data) {
        return data;
    },
    submit: function (method, action) {
        var result = $.Deferred(), self = this, url;
        method = method || this.options.method || 'GET';
        action = action || this.options.action;
        if (method === 'GET') {
            url = this.buildUri(action).toString();
            routes.route(url);
            result.resolve(url);
        } else {
            if(this.multipart){
                var el = this.getEl();
                http.submit(el, action, method).done(function(response){
                    result.resolve(response);
                }).fail(function(response){
                    self.parseErrors(response);
                    result.reject(self.getErrors());
                });
            }else{
                http[method.toLowerCase()](action, self.toJSON()).done(function (response) {
                    result.resolve(response);
                }).fail(function (response) {
                    self.parseErrors(response);
                    result.reject(self.getErrors());
                })
            }
        }
        return result;
    },
    _notifyReady: function () {
      var callbacks = this._onReadyCallbacks;
      while(callbacks && callbacks.length){
          callbacks.shift()(this);
      }
    },
    _runValidators: function(next){
        if(!this.ready){
            throw new Error("Cannot validate till the previous validation is complete");
        }
        var cleanedData = {}, errors = [], validators = this._validators.slice(0), self = this;
        this._validating = true;
        this._nonFieldErrors = [];
        validateFieldSet(this, this.getFields().slice(0), cleanedData, validators, errors, function (data, errors) {
            self._completeValidation(cleanedData, errors, next);
        });
    },
    _completeValidation: function (data, errors, next) {
        var self = this;
        this._validating = false;
        if(errors.length===0){
            try{
                data = this.clean(data);
            }catch(e){
                errors.push({code: '__all__', message: e.message});
            }
        }
        _.each(errors, function(value){
            if(_.isPlainObject(value)){
                _.each(value, function (v, k) {
                    self.addError(v, k);
                })
            }else{
                self.addError(value)
            }
        });
        this._notifyReady();
        if(next){
            next(data, errors);
        }        
    }
};

Object.defineProperties(Form.prototype, {
    multipart: {
        get: function () {
            return _.some(this.getFields(), function (field) {
                return field.multipart;
            });
        }
    },
    ready: {
        get: function () {
            return !this._validating;
        }
    },
   disabled: {
       get: function(){
           return this._disabled;
       },
       set: function(value){
           this._disabled = value;
           _.each(this.getFields(), function (field) {
               field.disabled = value;
           });
           return this.setDisabled(value);
       }
   }
});

u.component("u-form", {
    initialize: function (ctx, content) {
        "use strict";
        _.bindAll(this, 'onChange', 'onSubmit');
        this.onChange = _.debounce(this.onChange, 500, {leading: true});
        if(ctx.form){
            if(!ctx.method){
                ctx.method = ctx.form.options.method;
            }
            if(!ctx.action){
                ctx.action = ctx.form.options.action;
            }
        }
    },
    onMount: function () {
        "use strict";
        var el = $(this.el);
        el.on("change", this.onChange);
        el.on("submit", this.onSubmit);
        // el.on("focusout", this.onChange)
    },
    onUnmount: function () {
        var el = $(this.el);
        el.off();
    },
    render: function (ctx, content) {
        "use strict";
        ctx.form.component = this;
        var form = ctx.form;
        return u("-form",
            {
                id: ctx.id,
                method: ctx.method,
                action: ctx.action,
                class: ['u-form', ctx.class],
            },
            fui.formMessage(form, ctx),
            content
        );
    },
    onChange: function (event) {
        "use strict";
        if (this.context.autosubmit) {
            this.onSubmit(event)
        }
    },
    onSuccess: function (form) {
       this.trigger("success", form);
    },
    onFailure: function (form) {
        this.trigger("failure", form);
    },
    completeSubmit: function (form, el) {
        "use strict";
        var self = this, ctx = this.context;
        var method = (ctx.method || "get").toUpperCase();
        var action = ctx.action || location.pathname;
        if (!form.isValid()) {
            self.onFailure(form);
            return;
        }
        if(this.context.nosubmit){
            this.onSuccess(form);
        }else {
            form.submit(method, action).done(function () {
                self.onSuccess(form);
            }).fail(function () {
                self.onFailure(form);
            });
        }
    },
    onSubmit: function (event) {
        "use strict";
        var self = this, el = u.dom.closest(event.target, "FORM"), ctx = this.context;
        var form = this.context.form;
        event.preventDefault();
        form.setBound(true);
        if(!form.ready){
            return;
        }
        u.redraw();//submit event should cause a redraw
        form.validate(function () {
            self.completeSubmit(form, el);
        });
    }
});




module.exports = {
    Form: Form
}