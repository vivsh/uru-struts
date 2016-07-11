
var errors = require("./errors");

function ErrorList() {
    this._data = [];
}

ErrorList.prototype = {
    constructor: ErrorList,
    all: function(){
        return this._data.slice(0);
    },
    add: function(error){
        this._data.push(error);
    },
    size: function(){
        return this._data.length;
    },
    isEmpty: function () {
        return this.size() === 0;
    },
    clear: function(){
        this._data.splice(0, this._data.length);
    }
}


function FormField(type, form){
    "use strict";
    this.form = form;
    this.type = type;
    this.silent = true;
    this.layout = "stacked";
    this._data = null;
}

FormField.prototype = {
    constructor: FormField,
    isRequired: function(){
        return !!this.type.options.required;
    },
    setRequired: function(value){
        this.type = this.type.update({required: !!value});
    },
    getInitial: function(){
        return this.type.options.default;
    },
    setInitial: function(value){
        this.type = this.type.update({default: value});
    },
    getChoices: function(){
        return this.type.options.choices || [];
    },
    setChoices: function(values){
        this.type = this.type.update({choices: values});
    },
    getWidget: function(){
        return this.type.options.widget;
    },
    setWidget: function(value){
        this.type = this.type.update({widget: widget});
    },
    getName: function(){
        return this.type.name;
    },
    getErrors: function(){
        return this.form.errors[this.name];
    },
    getMessages: function(){
        return this.type.options.messages;
    },
    setMessages: function(value){
        this.type = this.type.update({messages: value});
    },
    getData: function(){
        return this._data;
    },
    getValue: function(){
        return this.form.get(this.name);
    },
    setValue: function(value){
        var kwargs = {};
        kwargs[this.name] = value;
        this.form.set(kwargs);
    },
    render: function(){

    }
}

module.exports = {
    FormField: FormField
}
