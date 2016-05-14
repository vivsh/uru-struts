
var _ = require("lodash"),
    u = require("uru"),
    moment = require("moment"),
    validators = require("./validators"),
    widgets = require("./widgets"),
    utils = require("./utils");


var fieldRegistry = {};


 function validateField(value, validators, errors, next) {
     if(!validators || !validators.length){
         next(value, errors);
     }else{
         var func = validators.shift();
         func(value, function (value, msg) {
             if(msg){
                errors.push(msg);
                validators.splice(0, validators.length);
                 value = null;
             }
             validateField(value, validators, errors, next);
         });
     }
 }


function FormField(options) {
    "use strict";
    var ops = this.options = _.extend({}, this.options, options);
    this.name = ops.name;
    this.id = "id_" + this.name + "" + _.uniqueId();
    var widget = ops.widget || "string";
    this.widget = _.isString(widget) ? {type: widget} : widget;
    this._disabled = !!options.disabled;
    this._status = "ready";
    this._bound = false;
    this._errors = [];
    this._value = null;
    this._validators = ops.validators ? ops.validators.slice(0) : [];
    this._readyCallbacks = [];

    if(this.initialize){
        this.initialize.apply(this, arguments);
    }

    if (options.hasOwnProperty("value")) {
        this.options.initialValue = options.value;
    }
}

FormField.prototype = {
    constructor: FormField,
    options: {
        emptyValue: null,
        required: true,
        initialValue: "",
    },
    isMultipart: function(){
        return false;
    },
    getEmptyValue: function () {
       return this.options.emptyValue;
    },
    getInitialValue: function () {
       return this.options.initialValue;
    },
    setInitialValue: function (value) {
        this.options.initialValue = value;
    },
    isRequired: function(){
        return this.options.required;
    },
    isHidden: function(){
        return this.getWidgetClass().prototype.hidden;
    },
    isBound: function () {
        return this._bound;
    },
    isEmpty: function(value){
        "use strict";
        return value === null || value === '' || value === undefined || (value && value.length === 0);
    },
    isReady: function () {
        return this._status === 'ready';
    },
    isValid: function () {
        return this._errors.length === 0;
    },
    isDisabled: function(){
        return this._disabled || !this.isReady();
    },
    getOptions: function () {
        return this.options;
    },
    setDisabled: function(value){
        this._disabled = value;
    },
    getChoices: function () {
        return this.options.choices;
    },
    setChoices: function (choices) {
        this.options.choices = choices;
    },
    getWidgetClass: function(){
        return widgets.widget(this.widget.type);
    },
    toJS: function (value) {
        "use strict";
        return value;
    },
    toString: function(){
        "use strict";
        return "" + this.value;
    },
    toJSON: function(){
        "use strict";
        return this.value;
    },
    getErrors: function () {
        return this._errors;
    },
    getValue: function () {
        "use strict";
        if(!this.isBound()){
            return this.getInitialValue();
        }
        return this._errors.length === 0 ? this._value : null;
    },
    setValue: function (value, next) {
        "use strict";
        this._runValidators(value, next);
    },
    getHelp: function () {
        return this.options.help;
    },
    getLabel: function () {
        return this.options.label;
    },
    setHelp: function (value) {
        this.options.help = value;
    },
    setLabel: function (value) {
        this.options.label = value;
    },
    getWidgetAttributes: function () {
        return {};
    },
    callWhenReady: function(callback){
        if(this.isReady()){
            callback()
        }else{
            this._readyCallbacks.push(callback);
        }
    },
    _getValidators: function () {
      var validators = [], self = this;

        validators.push(function (value, cb) {
            try {
                value = self.toJS(value);
                cb(value);
            }catch (e){
                cb(null, e.message);
            }
        });

        if(this.validate){
            validators.push(function(value, next){
                try{
                    self.validate.apply(self, arguments);
                }catch(e){
                    next(null, {code: "invalid", message: e.message});
                }
            })
        }

        validators.splice.apply(validators, [0, 0].concat(this._validators));
        return validators;
    },
    _updateValue: function (value) {
        this._value = value;
    },
    addError: function (msg) {
        if(_.isString(msg)){
            msg = {message: msg};
        }
        this._errors.push(msg);
    },
    _runValidators: function (value, next) {
      var errors = [], self = this;
        if(!this.isReady()){
           throw new Error("Cannot set value during validation");
        }
        this._status = 'validating';
        this._errors = [];
        if(self.isEmpty(value)){
            if(this.isRequired()){
                errors.push({"code": "required", message: "This field is required"})
                value = null;
            }else{
                value = this.getEmptyValue();
            }
            self._completeValidation(value, errors, next);
        }else{
            validateField(value, this._getValidators(), errors, function(value, errors){
                self._completeValidation(value, errors, next);
            });
        }
    },
    _completeValidation: function (value, errors, next) {
        var self = this;
        _.each(errors, function(){ self.addError.apply(self, arguments) });
        if(self._errors.length === 0){
            self._bound = true;
            self._updateValue(value);
        }else{
            self._value = null;
            self._bound = false;
        }
        self._status = 'ready';
        _.each(self._readyCallbacks, function (func) {
            func();
        })
        self._readyCallbacks = [];
        if(next){
            next(self);
        }
    }
};


FormField.extend = function(){
    var class_ = u.utils.extend.apply(this, arguments);
    class_.prototype.options = _.defaultsDeep(class_.prototype.options, this.prototype.options);
    return class_;
}


utils.beanify(FormField, ['help', 'label', 'errors', 'choices', 'required', 'emptyValue']);


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
            _.map(field.getErrors(), function (msg) {
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

        if(field.isHidden()){
            return widget
        }

        return u(".u-form-field.u-form-field-"+field.type + "."+layoutClass,
            {class: [{"has-error": !ctx.field.isValid()}, ctx.class]},
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
    },
    toJS: function (value) {
        if(!_.isArray(value)){
            value = [value];
        }
        var coerce = this.options.coerce;
        return _.map(value, function(v){
            "use strict";
            return coerce(v);
        });
    },
    toJSON: function () {
        return this.value;
    },
    validate: function(values, next){
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
            next(null, invalids.join(", ") + " are not valid choices");
        }else{
            next(values);
        }
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
        return this.options.coerce(value);
    },
    toJSON: function () {
        return this.value;
    },
    validate: function(value, next){
        "use strict";
        var choices = this.choices;
        var valid = _.some(choices, function(item){
            return item.value === value;
        });
        if(!valid){
            next(null, "" + value + " is an invalid choice");
        }else{
            next(value);
        }
    }
});


registerField("date", {
    widget: "date",
    options: {
        min: null,
        max: null,
        format: "DD MMMM, yyyy"
    },
    toJS: function (value) {
        if(_.isString(value)){
            return moment(value, this.options.format).toDate();
        }
        return value;
    },
    toJSON: function () {
        return moment(this.getValue()).toISOString(this.options.format);
    },
    toString: function(){
        "use strict";
        return moment(this.getValue()).format(this.options.format)
    },
    validate: function(value, next){
        "use strict";
        var op = this.options;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
        next(value);
    }
});


registerField("datetime", {
    options: {
        min: null,
        max: null,
        format: "dd/MM/yyyy hh:mm"
    },
    widget: "datetime",
    toJS: function (value) {
        if(_.isString(value)){
            return moment(value, this.options.format).toDate();
        }
        return value;
    },
    toJSON: function () {
        return this.getValue();
    },
    toString: function(){
        "use strict";
        return moment(this.getValue()).format(this.options.format)
    },
    validate: function(value, next){
        "use strict";
        var op = this.options;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
        next(value);
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
    toString: function(){
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
    toString: function(){
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
            value = value in {true:1, on:2, yes:3};
        }
        return !! value;
    },
    toJSON: function () {
        return this.getValue();
    },
    toString: function(){
        "use strict";
        return this.getValue() ? "true" : "";
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
    validate: function(value, next){
        "use strict";
        var op = this.options;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
        next(value);
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
    validate: function(value, next){
        "use strict";
        var op = this.options;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
        next(value);
    }
});

registerField("email", {
    options:{
        widget: "email"
    },
    validate: function(value, next){
        if(!validators.isEmail(value)) {
            throw new Error("" + value + " is not a valid email");
        }
        next(value)
    }
});


registerField("phone", {
    options:{
        widget: "phone",
        help: "Please enter your 10 digit mobile number",
    },
    validate: function(value, next){
        if(!validators.isIndianMobilePhoneNumber(value)) {
            throw new Error("" + value + " is not a valid mobile phone number.");
        }
        next(value);
    },
    prepare: function(value){
        "use strict";
        value = value.replace(/\D+/, '');
        return value.substr(value.length-10);
    }
});


registerField("string", {
   options: {
        maxLength: null,
        minLength: null,
        pattern: null,
        widget: "string"
   },
    validate: function(value, next){
        "use strict";
        var op = this.options, len = value.length, pattern;
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
        next(value);
    }
});


registerField("text", {
   options: {
        maxLength: null,
        minLength: null,
        rows: 4,
        widget: "text"
   },
    validate: function(value, next){
        "use strict";
        var op = this.options, len = value.length, pattern;
        if(op.minLength != null && len <= op.minLength){
            throw new Error("Value cannot be less than " + op.minLength);
        }
        if(op.maxLength != null && len >= op.maxLength){
            throw new Error("Value cannot be more than " + op.maxLength);
        }
        next(value);
    }
});


module.exports = {
    field: registerField,
    Field: FormField,
    createField: createField,
    validateField: validateField
};