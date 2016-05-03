

var _ = require("lodash");


function ValidationError(message, code, name){

}


function ErrorList(errors) {
    this._errors = errors || {};
}

ErrorList.prototype = {
    constructor: ErrorList,
    add: function(message){
        this._errors.push(message);
    },
    get: function () {
        return this._errors;
    },
    set: function (errors) {
        this._errors = errors;
    },
    clear: function () {
        this._errors = {};
    }
}