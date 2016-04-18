
var u = require("uru"),
    _ = require("underscore"),
    utils = require("./utils"),
    fields = require("./fields");


var Form = u.utils.Class({
    constructor: function(data){
       "use strict";
        var fieldset = {}, self = this;
        data = this.data = data || this.getDataFromUrl() || {};
        _.each(this.fields, function(value, key){
            var options = _.isString(value) ? {type: value} : value;
            options = _.extend({name: key}, options);
            fieldset[options.name] = fields.createField(options);
        });
        this.fields = fieldset;
        // if(this.data){
        //     _.each(this.data, function(v, k){
        //         fields[k].value = v;
        //     });
        // }
        this.onSubmit = _.bind(this.onSubmit, this);

    },
    getDataFromUrl: function () {
        return;
    },
    field: function(name){
        "use strict";
        return this.fields[name].render();
    },
    fieldSet: function(fieldNames){
        "use strict";
        return new FieldSet(this, fieldNames);
    },
    isValid: function(){
        "use strict";
        return _.all(this.fields, function(field, name){
            return field.isValid();
        });
    },
    cleanedData: function(){
        "use strict";
        var result = {};
        _.each(this.fields, function(field){
            result[field.name] = field.getValue();
        });
        return result;
    },
    serialize: function(){
        "use strict";
        var result = {};
        _.each(this.fields, function(field){
            if(!field.isEmpty(field.getValue())){
                result[field.name] = field.toStr();
            }
        });
        return result;
    },
    onSubmit: function(event){
        "use strict";
        var el = event.target;
        var data = this.cleanedData();
        var method = (el.method || "get").toUpperCase();
        // if(!this.isValid()){
        //     event.preventDefault();
        //     return;
        // }
        console.log(data);
        console.log(this.serialize())
        var parts = utils.parseUri(el.action);
        parts.query = this.serialize();
        var url = utils.buildUri(parts);
        u.route(url, true);
        if(method === 'GET'){
            event.preventDefault();
        }else{
            var formData = new FormData();
            
        }
    }
});


function FieldSet(form, fieldNames){
       "use strict";
        var fields = {}, self = this;
        _.each(fieldNames, function(name, i){
            fields[name] = new Field(self, form.field(name));
        });
        this.fields = fields;
}

FieldSet.prototype = {
    constructor: FieldSet,
    field: function(name){
        "use strict";
        return this.fields[name].render();
    },
    isValid: function(){
        "use strict";
        return _.all(this.fields, function(field, name){
            return field.isValid();
        });
    }
};



u.component("struts-form", {
   initialize: function(){
       "use strict";
   },
   getContext: function(ctx){
       "use strict";
       return {
           valid: ctx.form.isValid()
       }
   },
   render: function(ctx, content){
       "use strict";
        return u("-form",
            {
                method: ctx.method,
                action: ctx.action,
                classes: ['u-form', ctx.classes],
                onsubmit: ctx.form.onSubmit
            },
            u("div.u-form-errors.u-non-field-errors", {show: !ctx.form.isValid()},
                ctx.message || "There are some errors in this form"
            ),
            content
        );
   },
    onMount: function () {
        var el = this.el;
        $(el).on("submit", this.onSubmit);
    },
    onUnmount: function(){
        "use strict";
        $(this.el).off();
    }
});


module.exports = {
    Form: Form,
}