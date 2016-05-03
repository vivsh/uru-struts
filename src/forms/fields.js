
var _ = require("lodash"),
    u = require("uru"),
    moment = require("moment"),
    validators = require("./validators"),
    widgets = require("./widgets");


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
    var ops = this.options = _.defaultsDeep(options, this.constructor.prototype.options);
    this.name = ops.name;
    this.id = "id_" + this.name;
    var widget = ops.widget || "string";
    this.widget = _.isString(widget) ? {type: widget} : widget;
    this._disabled = !!options.disabled;
    this._status = "ready";
    this._bound = false;
    this._errors = [];
    this._value = null;
    u.id(this);

    if(this.initialize){
        this.initialize.apply(this, arguments);
    }

    if (options.hasOwnProperty("value")) {
        this.setValue(options.value);
    }
}

FormField.prototype = {
    constructor: FormField,
    isRequired: function () {
        return !! this.options.required;
    },
    isHidden: function(){
        var widgetClass = widgets.widget(this.widget.type);
        return widgetClass.hidden;
    },
    isBound: function () {
        return this._bound;
    },
    isEmpty: function(value){
        "use strict";
        return value === null || value === '' || value === undefined || (value && value.length === 0);
    },
    isReady: function () {
        return !this.isDisabled() && this._status === 'ready';
    },
    isValid: function () {
        return this._errors.length === 0;
    },
    isDisabled: function(){
        return this._disabled;
    },
    getOptions: function () {
        return this.options;
    },
    setDisabled: function(value){
        this._disabled = value;
    },
    toJS: function (value) {
        "use strict";
        return value;
    },
    toString: function(){
        "use strict";
        return String(this.getValue());
    },
    toJSON: function(){
        "use strict";
        return this.getValue();
    },
    getErrors: function () {
        return this._errors;
    },
    getChoices: function(){
        return this.options.choices;
    },
    getValue: function () {
        "use strict";
        return this._errors.length === 0 ? this._value : null;
    },
    setValue: function (value, next) {
        "use strict";
        this._runValidators(value, next);
    },
    getWidgetAttributes: function () {
        return {};
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

        validators.push(function (value, cb) {
            if(self.isEmpty(value)){
                cb(null, {"code": "required", message: "This field is required"})
            }else{
                cb(value);
            }
        });

        if(this.validate){
            validators.push(function(){
                self.validate.apply(self, arguments);
            })
        }

        validators.splice.apply(validators, [0, 0].concat(this._getValidators()));

        return validators;
    },
    _updateValue: function (value) {
        this._value = value;
    },
    _addError: function (msg) {
        if(_.isString(msg)){
            msg = {message: msg};
        }
        this._errors.push(msg)
    },
    _runValidators: function (value, next) {
      var errors = [], self = this;
        if(!this.isReady()){
           throw new Error("Cannot set value during validation");
        }
        this._status == 'validating';
        console.log(this.name, "<<<<<<<<<", this._getValidators());
        validateField(value, this.getValidators(), errors, function(value, errors){
            _.each(errors, self._addError);
            if(self._errors.length === 0){
                self._bound = true;
                self._updateValue(value);
            }else{
                self._value = null;
                self._bound = false;
            }
            self._status = 'ready';
            if(next){
                next(self);
            }
        });
    }
};


FormField.extend = u.utils.extend;


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
    initialize: function (attrs) {
        var options = _.extend({}, attrs);
        delete attrs.type;
        this.options = options;
        var field = this.getField();
        field.setOptions(this.options);
    },
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
        return form.fields[this.context.name];
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
    render: function (ctx) {
        var field = ctx.field;
        var name = field.name;
        var label = field.label ? u("label.u-form-label", {"for": field.id}, field.label) : null;
        var help = field.help ? u(".u-form-help", field.help) : null;
        var errors = u("ul.u-form-errors",
            field.errors.map(function (message) {
                return u("li", message);
            })
        );

        var layout = ctx.layout + "Layout";

        var layoutClass = "u-form-layout-" + ctx.layout;

        var componentClass = widgets.widget(field.widget.type);

        var attrs = _.extend({}, field.widget, field.getWidgetAttributes(), {
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

        if(field.isHidden() || componentClass.prototype.hidden){
            return widget
        }

        return u(".u-form-field.u-form-field-"+field.type + "."+layoutClass,
            {classes: {"has-error": !ctx.field.isValid()}},
            layoutFunc.call(this,layoutContext)
        );
    }
});




registerField("multiple-choice", {
    options: {
        coerce: function(value){return parseInt(value);}
    },
    widget: "multiple-select",
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
            throw new Error(invalids.join(", ") + " are not valid choices");
        }
        next();
    }
});


registerField("choice", {
    widget: "select",
    options: {
      coerce: parseInt
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
            throw new Error("" + value + " is an invalid choice");
        }
        next();
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
        return moment(this.value).toISOString(this.options.format);
    },
    toStr: function(){
        "use strict";
        return moment(this.value).format(this.options.format)
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
        next();
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
        return ;
    },
    toStr: function(){
        "use strict";
        return moment(this.value).format(this.options.format)
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
        next()
    }
});


registerField("boolean", {
    widget: "checkbox",
    emptyValue: false,
    toJS: function (value) {
        if(_.isString(value)){
            value = value in {true:1, on:2, yes:3};
        }
        return !! value;
    },
    toJSON: function () {
        return this.value;
    },
    toStr: function(){
        "use strict";
        return this.value ? "true" : "";
    },
});


registerField("number", {
    options: {
        min: null,
        max: null
    },
    widget: "integer",
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
        next();
    }
});


registerField("integer", {
    options: {
        min: null,
        max: null
    },
    widget: "number",
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
        next();
    }
});

registerField("email", {
   widget: "email",
    validate: function(value, next){
        if(!validators.isEmail(value)) {
            throw new Error("" + value + " is not a valid email");
        }
        next()
    }
});


registerField("phone", {
    widget: "phone",
    help: "Please enter your 10 digit mobile number",
    validate: function(value, next){
        if(!validators.isIndianMobilePhoneNumber(value)) {
            throw new Error("" + value + " is not a valid mobile phone number.");
        }
        next();
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
       pattern: null
   },
   widget: "string",
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
        next();
    }
});


registerField("text", {
   options: {
       maxLength: null,
       minLength: null,
       rows: 4
   },
   widget: "text",
    validate: function(value, next){
        "use strict";
        var op = this.options, len = value.length, pattern;
        if(op.minLength != null && len <= op.minLength){
            throw new Error("Value cannot be less than " + op.minLength);
        }
        if(op.maxLength != null && len >= op.maxLength){
            throw new Error("Value cannot be more than " + op.maxLength);
        }
        next();
    }
});


module.exports = {
    field: registerField,
    Field: FormField,
    createField: createField
};