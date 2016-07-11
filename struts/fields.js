
var _ = require("lodash"),
    u = require("uru"),
    moment = require("moment"),
    validators = require("./validators"),
    widgets = require("./widgets"),
    utils = require("./utils");


var fieldRegistry = {};


function validateField(value, validators, errors, callback){
    if(errors.length || validators.length === 0){
        callback(value, errors);
    }else{
        var validator = validators.shift(), async = null;
        try {
            validator(value, function (promise) {
                async = promise;
            });
        }catch(e){
            errors.push(e);
        }
        if(async){
            async.fail(function (e) {
                errors.push(e);
            }).always(function () {
                validateField(value, validators, errors, callback);
            });
        }else{
            validateField(value, validators, errors, callback);
        }
    }
};


function FormField(options) {
    "use strict";
    var ops = this.state = _.extend({}, this.options, options), state = ops;
    this.name = ops.name;
    this.id = "id_" + this.name + "" + _.uniqueId();
    var widget = ops.widget || "string";
    this.widget = _.isString(widget) ? {type: widget} : widget;
    this.state._validating = false;
    this.state._dirty = true;
    this.state._data = null;
    this.state._errors = [];
    this.state._value = null;
    this.state._bound = false;
    this.state._validators = ops.validators ? ops.validators.slice(0) : [];
    this.state._readyCallbacks = [];

    this.initialize.apply(this, arguments);

    if (options.hasOwnProperty("value")) {
        this.state.initialValue = options.value;
    }

    var initial = this.initial;
    if(initial != null){
        this.setValue(initial);
    }
}

FormField.prototype = {
    constructor: FormField,
    initialize: _.noop,
    options: {
        emptyValue: null,
        required: true,
        initialValue: "",
    },
    setBound: function (bound) {
        this.state._bound = !!bound;
    },
    isBound: function(){
        return this.state._bound;
    },
    isEmpty: function(value){
        "use strict";
        return value === null || value === '' || value === undefined
            || (value && value.length === 0) ;
    },
    isReady: function () {
        return !this.state._validating;
    },
    isValid: function () {
        return this.state._errors.length === 0;
    },
    getWidgetClass: function(){
        return widgets.widget(this.widget.type);
    },
    toJS: function (value) {
        "use strict";
        return value;
    },
    toQuery: function(){
        "use strict";
        return this.getValue();
    },
    toJSON: function(){
        "use strict";
        return this.getValue();
    },
    getErrors: function () {
        return this.state._errors;
    },
    clearErrors: function () {
        return this.state._errors = [];
    },
    getValue: function () {
        "use strict";
        return this.state._errors.length === 0 ? this.state._value : null;
    },
    setValue: function (value, next) {
        "use strict";
        this.state._data = value;
        this.state._dirty = true;
        this._runValidators(value, next);
    },
    getWidgetAttributes: function () {
        return {};
    },
    callWhenReady: function(callback){
        this.state._readyCallbacks.push(callback);
        if(this.ready){
            this._notifyReady();
        }
    },
    addError: function (msg) {
        if(_.isString(msg)){
            msg = {message: msg, code: "invalid"};
        }else if(msg instanceof Error){
           msg = {message: msg.message, stack: msg.stack, code: "invalid"}
        }
        this.state._errors.push(msg);
    },
    validate: function(next){
        if(this.state._validating){
            this.callWhenReady(next);
        }else{
            if(this.state._dirty){
                this._runValidators(this.state._data, next);
            }else{
                next(this);
            }
        }
    },
    getBoundErrors: function(){
        return this.isBound() ? this.getErrors() : [];
    },
    getBoundData: function(){
        return this.isValid() ? this.getValue() : this.state._data;
    },
    clean: function (value) {
        return value;
    },
    _notifyReady: function(){
       var callbacks = this.state._readyCallbacks;
        while(callbacks && callbacks.length){
            callbacks.shift()(this);
        }
    },
    _runValidators: function (value, next) {
      var errors = [], self = this;
        if(!this.ready || this.disabled){
           throw new Error("Not ready to be changed");
        }
        var validators = this.state._validators.slice(0);
        this.state._validating = true;
        this.state._errors = [];
        if(self.isEmpty(value) && this.required){
            errors.push({"code": "required", message: "This field is required"})
            value = null;
            self._completeValidation(value, errors, next);
        }else{
            value = this._runCleaner(value, errors, this.toJS);
            validateField(value, validators, errors, function(value, errors){
                self._completeValidation(value, errors, next);
            });
        }
    },
    _completeValidation: function (value, errors, next) {
        var self = this;
        if(!errors.length){
            value = this._runCleaner(value, errors, this.clean);
        }
        _.each(errors, _.bind(self.addError, this));
        if(self.state._errors.length === 0){
            this.state._value = value;
        }else{
            self.state._value = null;
        }
        self.state._validating = false;
        self.state._dirty = false;
        self._notifyReady();
        self.state._readyCallbacks = [];
        if(typeof next === 'function'){
            next(self);
        }
    },
    _runCleaner: function (value, errors, func) {
        try {
            return func.call(this, value);
        }catch(e){
            errors.push({code: "invalid", message: e.message});
        }
        return null;
    }
};


FormField.extend = function(){
    var class_ = u.utils.extend.apply(this, arguments);
    class_.prototype.options = _.merge({}, this.prototype.options, class_.prototype.options);
    return class_;
}

function createProperty(name){
    return {
        get: function(){
            var value = this.state[name];
            if(typeof value === 'function'){
                value = value();
            }
            return value;
        },
        set: function(value){
            this.state[name] = value;
        }
    }
}

Object.defineProperties(FormField.prototype, {
    ready: {
        get: function () {
            return !this.state._validating;
        }
    },
    multipart: {
        get: function () {
            return this.getWidgetClass().prototype.multipart;
        }
    },
    hidden: {
        get: function () {
            return this.getWidgetClass().prototype.hidden;
        }
    },
    data: {
        get: function () {
            return this.getBoundData();
        }
    },
    initial: {
        get: function () {
            return this.state.initialValue;
        }
    },
    errors: {
        get: function () {
            return this.state._errors;
        }
    },
    disabled: createProperty("disabled"),
    help: createProperty("help"),
    label: createProperty("label"),
    choices: createProperty("choices"),
    required: createProperty("required"),
});



function registerField(name, options) {
    "use strict";
    if (arguments.length == 1) {
        if(!(name in fieldRegistry)){
            throw new Error("Field not found: " + name);
        }
        return fieldRegistry[name];
    }
    var base = FormField;
    if(arguments.length === 3){
        options = arguments[2];
        base = fieldRegistry[arguments[1]];
    }
    if(name in fieldRegistry){
        throw new Error("Field already registered: " + name);
    }
    var factory = base.extend(options);
    fieldRegistry[name] = factory;
    factory.prototype.type = name;
}


function createField(options) {
    "use strict";
    var type = options.type;
    var class_ = registerField(type);
    return new class_(options);
}



u.component("u-field", {
    getForm: function () {
        "use strict";
        var owner = this.$owner;
        while (owner && owner.$name != "u-form") {
            owner = owner.$owner;
        }
        return owner ? owner.context.form : null;
    },
    getField: function () {
        var form = this.getForm();
        return form.getField(this.context.name);
    },
    getContext: function (ctx) {
        "use strict";
        var field = this.getField();
        return {
            field: field,
            layout: (ctx.layout || "vertical").toLowerCase()
        }
    },
    verticalLayout: function (ctx) {
        return [
            ctx.label,
            u("div", {class: ctx.widgetClass},
                ctx.widget,
                ctx.help,
                ctx.errors
            )
        ]
    },
    horizontalLayout: function () {
        "use strict";
        return this.verticalLayout(ctx);
    },
    inlineLayout: function (ctx) {
        "use strict";
        return this.verticalLayout(ctx);
    },
    formatMessage: function (name, code, defaultMessage) {
        return this.getForm().getValidationMessage(name, code, defaultMessage);
    },
    render: function (ctx) {
        var self = this;
        var attrs = _.omit(ctx, ["name"]);
        var field = ctx.field;
        var name = field.name;
        var label = field.label ? u("label.u-form-label", {"for": field.id}, field.label) : null;
        var help = field.help ? u(".u-form-help", field.help) : null;
        var errors = u("ul.u-form-errors",
            _.map(field.getBoundErrors(), function (msg) {
                return u("li", self.formatMessage(field.name, msg.code, msg.message));
            })
        );

        var layout = ctx.layout + "Layout";

        var layoutClass = "u-form-layout-" + ctx.layout;

        var componentClass = field.getWidgetClass();

        var attrs = _.extend({}, field.widget, {
            field: field,
            name: name,
            layout: ctx.layout,
            attrs: field.getWidgetAttributes()
        });

        var widget = u(componentClass, attrs);

        var layoutFunc = componentClass[layout] || this[layout]
            || componentClass['verticalLayout'] || this['verticalLayout'];

        var layoutContext = {
            widgetClass: ['u-form-widget', 'u-form-widget-'+field.widget.type],
            widget: widget,
            errors: errors,
            help: help,
            layout: ctx.layout,
            label: label
        }

        if(field.hidden){
            return widget
        }

        return u(".u-form-field.u-form-field-"+field.type + "."+layoutClass,
            {class: [{"has-error": !field.isValid() && field.isBound()}, ctx.class]},
            layoutFunc.call(this,layoutContext)
        );
    }
});


registerField("multiple-choice", {
    options: {
        coerce: function(value){
            return parseInt(value);
        },
        widget: "multiple-select",
        initialValue: [],
    },
    toJS: function (value) {
        if(!_.isArray(value)){
            value = [value];
        }
        var coerce = this.state.coerce;
        var result =  _.map(value, function(v){
            "use strict";
            return coerce(v);
        });
        return result;
    },
    toJSON: function () {
        var value = this.getValue();
        return value;
    },
    clean: function(values){
        "use strict";
        var choices = this.choices;
        var invalids = [];
        _.each(values, function(value){
             var valid = _.some(choices, function(item){
                 return item.value === value;
            });
            if(!valid){
                invalids.push(value);
            }
        });
        if(invalids.length){
            throw new Error(invalids.join(", ") + " are not valid choices");
        }
        return values;
    }
});


registerField("choice", {
    options: {
        coerce: function (value){
            return parseInt(value);
        },
        widget: "select",
    },
    toJS: function (value) {
        return this.state.coerce(value);
    },
    toJSON: function () {
        return this.getValue();
    },
    clean: function(value){
        "use strict";
        var choices = this.choices;
        var valid = _.some(choices, function(item){
            return item.value === value;
        });
        if(!valid){
            throw new Error("" + value + " is an invalid choice");
        }
        return value;
    }
});

function updateInitialChoice(state) {
    var initial = state.initialValue, choices = state.choices;
    var exists = _.some(choices, function (item) {
        return String(item.value) === String(initial);
    });
    if(!exists && choices.length){
        state.initialValue = choices[0].value;
    }
}

Object.defineProperties(fieldRegistry['choice'].prototype, {
    initial: {
        get: function () {
            updateInitialChoice(this.state);
            return this.state.initialValue;
        }
    },
    choices:{
        get: function () {
            return this.state.choices;
        },
        set: function (choices) {
            this.state.choices = choices;
            updateInitialChoice(this.state);
        }
    }
})

registerField("date", {
    options: {
        widget: "date",
        min: null,
        max: null,
        format: "DD MMMM, yyyy"
    },
    toJS: function (value) {
        if(_.isString(value)){
            return moment(value, this.state.format).toDate();
        }
        return value;
    },
    toJSON: function () {
        return moment(this.getValue()).toISOString(this.state.format);
    },
    toQuery: function(){
        "use strict";
        return moment(this.getValue()).format(this.state.format)
    },
    clean: function(value){
        "use strict";
        var op = this.state;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
        return value;
    }
});


registerField("datetime", {
    options: {
        min: null,
        max: null,
        format: "DD/MM/YYYY HH:mm",
        widget: "datetime",
    },
    toJS: function (value) {
        if(_.isString(value)){
            return moment(value, this.state.format).toDate();
        }
        return value;
    },
    toJSON: function () {
        return this.getValue();
    },
    toQuery: function(){
        "use strict";
        return moment(this.getValue()).format(this.state.format)
    },
    clean: function(value){
        "use strict";
        var op = this.state;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
        return value;
    }
});


registerField("file", {
    options:{
        widget: "file",
    },
    toJS: function (value) {
        return value;
    },
    toJSON: function () {
        return this.getValue();
    },
    toQuery: function(){
        "use strict";
        return this.getValue();
    }
});


registerField("multiple-file", {
    options:{
        widget: "multiple-file",
    },
    toJS: function (value) {
        return value;
    },
    toJSON: function () {
        return this.getValue();
    },
    toQuery: function(){
        "use strict";
        return this.getValue();
    }
});


registerField("boolean", {
    options:{
        widget: "checkbox",
        emptyValue: false,
        initialValue: false,
    },
    toJS: function (value) {
        if(_.isString(value)){
            value = value in {true:1, on:2, yes:3} || (this.state.initialValue && value == String(this.state.initialValue));
        }
        return !! value;
    },
    toJSON: function () {
        return this.getValue();
    },
    toQuery: function(){
        "use strict";
        var value = this.state.initialValue || "true";
        return this.getValue() ? value : "";
    }
});


registerField("number", {
    options: {
        min: null,
        max: null,
        widget: "integer"
    },
    toJS: function (value) {
        return parseFloat(value);
    },
    clean: function(value){
        "use strict";
        var op = this.state;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
        return value;
    }
});


registerField("integer", {
    options: {
        min: null,
        max: null,
        widget: "number"
    },
    toJS: function (value) {
        return parseInt(value);
    },
    clean: function(value){
        "use strict";
        var op = this.state;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
        return value;
    }
});

registerField("integer-list", {
    options: {
        widget: "hidden",
        stringSeparator: ","
    },
    initialize: function(){
        this.$super.initialize.apply(this, arguments);
        this.baseField = new createField({type: "integer"});
    },
    toJS: function (value) {
        var self = this;
        if(_.isString(value)){
            value = value.split(this.options.stringSeparator);
        }
        if(!_.isArray(value)){
            value = [value];
        }
        return _.map(value, function (val) {
            return self.baseField.toJS(val);
        })
    }
});

registerField("email", {
    options:{
        widget: "email"
    },
    clean: function(value){
        if(!validators.isEmail(value)) {
            throw new Error("" + value + " is not a valid email");
        }
        return value;
    }
});


registerField("phone", {
    options:{
        widget: "phone",
        help: "Please enter your 10 digit mobile number",
    },
    clean: function(value){
        if(!validators.isIndianMobilePhoneNumber(value)) {
            throw new Error("" + value + " is not a valid mobile phone number.");
        }
        value = value.replace(/\D+/, '');
        return value.substr(value.length-10);
    }
});


registerField("phone-email", {
    options:{
        widget: "string",
        help: "Please enter your email or 10 digit mobile number",
    },
    clean: function(value){
        if(!validators.isPhoneOrEmail(value)) {
            throw new Error("" + value + " is not a valid mobile phone number or email address");
        }
        return value;
    }
});


registerField("string", {
   options: {
        maxLength: null,
        minLength: null,
        pattern: null,
        widget: "string"
   },
    clean: function(value){
        "use strict";
        var op = this.state, len = value.length, pattern;
        if(op.minLength != null && len <= op.minLength){
            throw new Error("Value cannot be less than " + op.minLength);
        }
        if(op.maxLength != null && len >= op.maxLength){
            throw new Error("Value cannot be more than " + op.maxLength);
        }
        if((pattern = op.pattern) != null){
            pattern = pattern instanceof RegExp ? pattern : new RegExp(pattern);
            if(!pattern.test(value)){
                throw new Error("Invalid value");
            }
        }
        return value;
    }
});


registerField("text", {
   options: {
        maxLength: null,
        minLength: null,
        rows: 4,
        widget: "text"
   },
    clean: function(value){
        "use strict";
        var op = this.state, len = value.length;
        if(op.minLength != null && len <= op.minLength){
            throw new Error("Value cannot be less than " + op.minLength);
        }
        if(op.maxLength != null && len >= op.maxLength){
            throw new Error("Value cannot be more than " + op.maxLength);
        }
        return value;
    }
});


module.exports = {
    field: registerField,
    Field: FormField,
    createField: createField,
    validateField: validateField
};