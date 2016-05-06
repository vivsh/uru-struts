var u = require("uru"),
    _ = require("lodash"),
    utils = require("./utils"),
    fields = require("./fields"),
    http = require("./http"),
    routes = require("./routes"),
    fui = require("./fui");


 function validateFieldSet(fieldSet, data, validators, errors, next) {
     if(!fieldSet.length){
         fields.validateField(data, validators, errors, next);
     }else{
         var field = fieldSet.shift();
         var callback = function(){
             if(field.isValid()){
                data[field.name] = field.getValue();
             }
            validateFieldSet(fieldSet, data, validators, errors, next);
         };
         if(field.isBound()){
             field.callWhenReady(callback);
         }else{
             field.setValue(null, callback);
         }
     }
 }


function Form(data){
    "use strict";
    var fieldset = {}, self = this, field;

    this._nonFieldErrors = [];
    this._validators = this._validators ? this._validators.slice(0) : [];
    this._status = 'ready';
    this._data = _.extend({}, this.getQueryDict(), data);
    this._onReadyCallbacks = [];
    this._messages = this.messages || {};

    _.each(this.fields, function (value, key) {
        var options = _.isString(value) ? {type: value} : value;
        options = _.extend({name: key}, options);
        fieldset[options.name] = fields.createField(options);
    });

    this.fields = fieldset;
    if (this._data) {
        _.each(this._data, function (v, k) {
            if (k in fieldset) {
                var field = fieldset[k];
                if(!field.isEmpty(v)){
                    field.setValue(v);
                }
            }
        });
    }

    if(this.initialize){
        this.initialize.apply(this, arguments);
    }
}


Form.extend = function(){
    var class_ = u.utils.extend.apply(this, arguments);
    class_.prototype.messages = _.defaultsDeep(class_.prototype.messages, this.prototype.messages);
    return class_;
}


Form.prototype = {
    constructor: Form,
    messages: {
        failure: "There were some errors in the form"
    },
    isReady: function(){
        return this._status === 'ready';
    },
    callWhenReady: function (callback) {
        if(this.isReady()){
            callback()
        }else{
            this._onReadyCallbacks.push(callback);
        }
    },
    getData: function () {
        return this._data;
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
    parseErrors: function(jqXHR){
        var status = jqXHR.status, self = this;
        self._nonFieldErrors = [];
        if(status === 400){
            var errors = jqXHR.responseJSON;
            _.each(errors, function (values, key) {
                var field = self.fields[key];
                if(field && !field.isHidden()){
                    _.each(values, function (value) {
                        field.addError(value);
                    })
                }else{
                    self._nonFieldErrors.push.apply(self._nonFieldErrors, values);
                }
            });
        }
    },
    getNonFieldErrors: function () {
        "use strict";
        var hidden = [];
        _.each(this.getFields(), function (f) {
            if (f.isHidden()) {
                hidden.push.apply(hidden, f.errors);
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
    getField: function (name) {
        return this.fields[name];
    },
    getFields: function () {
        return _.values(this.fields);
    },
    getVisibleFields: function () {
        return _.filter(this.getFields(), function(field){
            return !field.isHidden();
        });
    },
    getHiddenFields: function () {
        return _.filter(this.getFields(), function(field){
            return field.isHidden();
        });
    },
    getQueryDict: function () {
        return utils.parseUri(location.href).query;
    },
    createFieldSet: function (fieldNames) {
        "use strict";
        return new FieldSet(this, fieldNames);
    },
    isValid: function () {
        "use strict";
        return !this._nonFieldErrors.length && _.every(this.getFields(), function (field, name) {
            return field.isValid();
        });
    },
    validate: function (next) {
        this._runValidators(next);
    },
    cleanedData: function () {
        "use strict";
        console.log("this function is now deprecated");
        return this.getCleanedData();
    },
    serializeArray: function () {
        "use strict";
        if(this.component){
            return this.component.serializeArray();
        }
        return null;
    },
    serialize: function () {
        "use strict";
        if(this.component){
            return this.component.serialize();
        }
        return null;
    },
    _getValidators: function () {
      return this._validators.slice(0);
    },
    setDisabled: function (value) {
        _.each(this.getFields(), function(f){
            f.setDisabled(value);
        });
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
    _runValidators: function(next){
        if(!this.isReady()){
            throw new Error("Cannot validate till the previous validation is complete");
        }
        var cleanedData = {}, errors = [], validators = this._getValidators(), self = this;
        this._status = "validating";
        self.setDisabled(true);
        validateFieldSet(this.getFields().slice(0), cleanedData, validators, errors, function (data, errors) {
            self._status = "ready"
            self._nonFieldErrors = errors;
            self.setDisabled(false);
            _.each(self._onReadyCallbacks, function (func) {
                func();
            })
            self._onReadyCallbacks = [];
            if(next){
                next(data, errors);
            }
        });
    }
};


function FieldSet(form, fieldNames) {
    "use strict";
    var fields = {}, self = this;
    _.each(fieldNames, function (name, i) {
        fields[name] = new Field(self, form.field(name));
    });
    this.fields = fields;
}

FieldSet.prototype = {
    constructor: FieldSet,
    field: function (name) {
        "use strict";
        return this.fields[name].render();
    },
    isValid: function () {
        "use strict";
        return _.every(this.fields, function (field, name) {
            return field.isValid();
        });
    }
};


u.component("u-form", {
    initialize: function () {
        "use strict";
        _.bindAll(this, 'onChange', 'onSubmit');
        this.onChange = _.debounce(this.onChange, 500, {leading: true});
        // this.onSubmit = _.debounce(this.onSubmit, 500, {leading: true});
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
    serialize: function () {
        return $(this.el).serialize();
    },
    serializeArray: function () {
        return $(this.el).serializeArray();
    },
    onChange: function (event) {
        "use strict";
        if (this.context.autosubmit) {
            this.onSubmit(event)
        }
    },
    onSuccess: function () {
       if(this.context.onsuccess){
           this.context.onsuccess.apply(this.$owner, arguments);
       }
       this.trigger("success", this.context.form);
    },
    onFailure: function () {
       if(this.context.onfailure){
           this.context.onfailure.apply(this.$owner, arguments);
       }
        this.trigger("failure", this.context.form);
    },
    completeSubmit: function (form, el) {
        "use strict";

        var self = this;
        var method = (el.method || "get").toUpperCase();
        var parts = utils.parseUri(el.action || location.href);
        parts.query = $(el).serialize();
        var url = utils.buildUri(parts);

        if (!form.isValid()) {
            return;
        }

        this.lastUrl = url;

        if (method === 'GET') {
            routes.route(url);
            this.onSuccess(form);
        } else {
            event.preventDefault();
            http.submit(el).done(function(data, textStatus, jqXHR){
                self.onSuccess(form, data);
            }).fail(function(jqXHR, textStatus, error){
                form.parseErrors(jqXHR);
                self.onFailure(form, form.getErrors());
            })
        }
    },
    onSubmit: function (event) {
        "use strict";
        var self = this, el = u.dom.closest(event.target, "FORM"), ctx = this.context;
        var form = this.context.form;

        event.preventDefault();

        if(!form.isReady()){
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