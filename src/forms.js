var u = require("uru"),
    _ = require("lodash"),
    utils = require("./utils"),
    fields = require("./fields"),
    http = require("./http"),
    routes = require("./routes");


var Form = u.utils.Class({
    constructor: function (data) {
        "use strict";
        var fieldset = {}, self = this;
        this.data = _.extend({}, this.getDataFromUrl(), data);
        _.each(this.fields, function (value, key) {
            var options = _.isString(value) ? {type: value} : value;
            options = _.extend({name: key}, options);
            fieldset[options.name] = fields.createField(options);
        });
        this.fields = fieldset;
        if (this.data) {
            _.each(this.data, function (v, k) {
                if (k in fieldset) {
                    fieldset[k].setValue(v, true);
                }
            });
        }
        this.lastUrl = location.href;
    },
    getDataFromUrl: function () {
        return utils.parseUri(location.href).query;
    },
    field: function (name) {
        "use strict";
        return this.fields[name].render();
    },
    fieldSet: function (fieldNames) {
        "use strict";
        return new FieldSet(this, fieldNames);
    },
    isValid: function () {
        "use strict";
        return _.every(this.fields, function (field, name) {
            return field.isValid();
        });
    },
    validate: function () {
      _.each(this.fields, function(f){
          "use strict";
            if(!f.bound){
                f.setValue(null, true);
            }
      });
    },
    cleanedData: function () {
        "use strict";
        var result = {};
        _.each(this.fields, function (field) {
            result[field.name] = field.getValue();
        });
        return result;
    },
    serialize: function () {
        "use strict";
        if(this.component){
            return this.component.serialize();
        }
        return null;
        // var result = {};
        // _.each(this.fields, function (field) {
        //     if (!field.isEmpty(field.getValue())) {
        //         result[field.name] = field.toStr();
        //     }
        // });
        // return result;
    }
});


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
        this.onSubmit = _.debounce(this.onSubmit, 250, {leading: true});
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
        return u("-form",
            {
                method: ctx.method,
                action: ctx.action,
                classes: ['u-form', ctx.classes],
                onsubmit: this.onSubmit
            },
            u("div.u-non-field-errors.text-center", {class: {"has-error": !ctx.form.isValid()}},
                u("div.u-form-errors",
                    u("div.callout.alert",
                        ctx.message || "There are some errors in this form"
                    )
                )
            ),
            content
        );
    },
    serialize: function () {
        return $(this.el).serialize();
    },
    onChange: function (event) {
        "use strict";
        if (this.context.autosubmit) {
            this.onSubmit(event)
        }
    },
    onSubmit: function (event) {
        "use strict";
        var el = u.dom.closest(event.target, "FORM"), ctx = this.context,
            owner = this.$owner;
        var form = this.context.form;
        var method = (el.method || "get").toUpperCase();
        var parts = utils.parseUri(el.action || location.href);
        parts.query = $(el).serialize();
        var url = utils.buildUri(parts);
        console.log("hello world");
        ctx.form.validate();

        if (!ctx.form.isValid() || url === this.lastUrl) {
            event.preventDefault();
            return;
        }

        if (ctx.onsuccess) {
            ctx.onsuccess.call(owner);
        }

        this.lastUrl = url;

        if (method === 'GET') {
            routes.route(url);
            event.preventDefault();
        } else {
            event.preventDefault();
            http.submit(el).done(function(data, textStatus, jqXHR){
                if(ctx.onsuccess){
                    ctx.onsuccess(data, textStatus, jqXHR);
                }else{
                    routes.route(data.nextUrl);
                }
            }).fail(function(jqXHR, textStatus, error){
                var status = jqXHR.status;
                if(status === 422){
                    var errors = jqXHR.responseJSON;
                    _.each(errors.data, function (values, key) {
                        var field = form.fields[key];
                        if(field){
                            _.each(values, function (value) {
                                field.addError(value.message, value.code.toLowerCase());
                            })
                        }
                    });
                    u.redraw();
                }
            })
        }

    }
});


module.exports = {
    Form: Form,
}