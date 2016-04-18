
var _ = require("underscore"),
    u = require("uru"),
    moment = require("moment"),
    validators = require("./validators"),
    widgets = require("./widgets");


var fieldRegistry = {};



function FormField(options) {
    "use strict";
    this.value = null;
    this.name = options.name;
    this.errors = options.errors || [];
    var choices = options.choices || this.choices;
    if(typeof  choices === "function"){
        choices = choices();
    }
    this.label = options.label || this.label;
    this.help = options.help || this.help;
    this.messages = options.errorMessages || this.messages || {};
    this.id = options.id || options.name + _.uniqueId();
    var widget = options.widget || this.widget || "string";
    this.widget = _.isString(widget) ? {type: widget} : widget;
    this.required = !!options.required;
    this.value = this.emptyValue;
    this.validators = [this.validate];

    if (options.validators) {
        this.validators = this.validators.concat(options.validators);
    }

    if(choices){
        choices = _.map(choices, this.parseChoice);
    }
    this.choices = choices;

    this._setOptions(options);

    if(this.initialize){
        this.initialize.apply(this, arguments);
    }

    if (options.hasOwnProperty("value")) {
        this.setValue(options.value);
    }

}

FormField.prototype = {
    constructor: FormField,
    needsMultiPart: false,
    emptyValue: null,
    _setOptions: function(options){
        "use strict";
        var defaults = _.extend({}, this.options), key;
        for(key in defaults){
            if(defaults.hasOwnProperty(key) && options.hasOwnProperty(key)){
                defaults[key] = options[key];
            }
        }
        this.options = defaults;
    },
    parseChoice: function(item){
        "use strict";
        return _.isArray(item) ? {value: item[0], label: item[1]} : item;
    },
    isEmpty: function(value){
        "use strict";
        return value === null || value === '' || value === undefined;
    },
    toJS: function (value) {
        "use strict";
        return value;
    },
    toStr: function(){
        "use strict";
        return "" + this.value;
    },
    toJSON: function(){
        "use strict";
        return this.value;
    },
    runValidator: function(value, callback){
        "use strict";
        try{
            return callback.call(this, value);
        }catch (e){
            this.addError(e.message, e.name);
        }
    },
    getErrorMessage: function (name) {
        return this.messages[name];
    },
    addError: function (message, name) {
        name = name || "invalid";
        message = this.getErrorMessage(name) || message;
        this.errors.push(message)
    },

    clean: function (value) {
        "use strict";
        var errors = this.errors = [], self = this;
        var validators = this.validators;
        var i;
        if(this.isEmpty(value)){
            if(this.required){
                this.addError("This field is required", "required");
            }
            value = this.emptyValue;
        }else{
            value = this.runValidator(value, function (value) {
                return self.toJS(value);
            });
            if (!errors.length) {
                for (i = 0; i < validators.length; i++) {
                    this.runValidator(value, validators[i]);
                }
            }
        }
        return errors.length !== 0 ? null : value;
    },
    validate: function(value){
        "use strict";

    },
    getValue: function () {
        "use strict";
        return this.errors.length === 0 ? this.value : null;
    },
    setValue: function (value) {
        "use strict";
        this.value = this.clean(value);
        console.log(value, this.name, this.value, this.errors);
        u.redraw();
    },
    isValid: function () {
        "use strict";
        return this.errors.length === 0;
    },
    getWidgetAttributes: function () {
        return {};
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
    return new registerField(type)(options);
}



u.component("struts-field", {
    getForm: function () {
        "use strict";
        var owner = this.$owner;
        while (owner && owner.$name != "struts-form") {
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
                ctx.widget
            ),
            ctx.help,
            ctx.errors
        ]
    },
    horizontalLayout: function () {
        "use strict";

    },
    inlineLayout: function () {
        "use strict";

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

        return u(".u-form-field.u-form-field-"+field.type, {classes: {"has-error": !ctx.field.isValid()}},
            layoutFunc(layoutContext)
        );
    }
});


registerField("multiple-choice", {
    options: {
        coerce: function(value){return parseInt(value);}
    },
    widget: "multiple-select",
    toJS: function (value) {
        var coerce = this.options.coerce;
        return _.map(value, function(v){
            "use strict";
            return coerce(v);
        });
    },
    toJSON: function () {
        return this.value;
    },
    validate: function(values){
        "use strict";
        var choices = this.choices;
        var invalids = [];
        _.each(values, function(value){
             var valid = _.any(choices, function(item){
                 return item.value === value;
            });
            if(!valid){
                invalids.push(value);
            }
        });
        if(invalids.length){
            throw new Error(invalids.join(", ") + " are not valid choices");
        }
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
    validate: function(value){
        "use strict";
        var choices = this.choices;
        var valid = _.any(choices, function(item){
            return item.value === value;
        });
        if(!valid){
            throw new Error("" + value + " is an invalid choice");
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
        return moment(this.value).toISOString(this.options.format);
    },
    toStr: function(){
        "use strict";
        return moment(this.value).format(this.options.format)
    },
    validate: function(value){
        "use strict";
        var op = this.options;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
    }
});


registerField("datetime", {
    options: {
        min: null,
        max: null,
        format: "DD MMMM, yyyy hh:mm"
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
    validate: function(value){
        "use strict";
        var op = this.options;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
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
    validate: function(value){
        "use strict";
        var op = this.options;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
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
    validate: function(value){
        "use strict";
        var op = this.options;
        if(op.min != null && value <= op.min){
            throw new Error("Value cannot be less than " + op.min);
        }
        if(op.max != null && value >= op.max){
            throw new Error("Value cannot be more than " + op.max);
        }
    }
});

registerField("email", {
   widget: "email",
    validate: function(value){
        if(!validators.isEmail(value)) {
            throw new Error("" + value + " is not a valid email");
        }
    }
});


registerField("phone", {
    widget: "phone",
    help: "Please enter your 10 digit mobile number",
    validate: function(value){
        if(!validators.isIndianMobilePhoneNumber(value)) {
            throw new Error("" + value + " is not a valid mobile phone number.");
        }
    },
    clean: function(value){
        "use strict";
        var result = this.$super.clean.call(this, value)
        if(result){
            value = value.replace(/\D+/, '');
            result = value.substr(value.length-10);
        }
        return result;
    }
});


registerField("string", {
   options: {
       maxLength: null,
       minLength: null,
       pattern: null
   },
   widget: "string",
    validate: function(value){
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
    }
});


registerField("text", {
   options: {
       maxLength: null,
       minLength: null,
       rows: 4
   },
   widget: "text",
    validate: function(value){
        "use strict";
        var op = this.options, len = value.length, pattern;
        if(op.minLength != null && len <= op.minLength){
            throw new Error("Value cannot be less than " + op.minLength);
        }
        if(op.maxLength != null && len >= op.maxLength){
            throw new Error("Value cannot be more than " + op.maxLength);
        }
    }
});


module.exports = {
    field: registerField,
    Field: FormField,
    createField: createField
};