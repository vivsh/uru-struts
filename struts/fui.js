var u = require("uru"),
    _ = require("lodash");


u.component("u-form-row", function (ctx) {
    var names = ctx.names;
    var span = 12 * 1 / names.length;
    return u(".row.medium-up-" + names.length,
        _.map(names, function (name) {
            return u(".column", u("u-field", {name: name, layout: ctx.layout || "vertical"}));
        })
    )
});


u.component("tooltip", {
    onMount: function () {
        var options = {
            tipText: this.context.message
        };
        this.tooltip = new Foundation.Tooltip($(this.el), options);
    },
    onUnmount: function () {
        this.tooltip.destroy();
    },
    render: function (ctx, content) {
        var tag = ctx.tag || "div";
        var message = ctx.message;
        var attrs = _.omit(ctx, ['message', "tag"])
        attrs.title = message;
        return u(tag, attrs, content);
    }
});


u.component("popover", {
    initialize: function () {
        var self = this;
        this.on("change:open", function(){
            self.dropdown.toggle();
        });
    },
    onMount: function () {
        var options = {
            closeOnClick: true,
            vOffset: 10,
            hOffset: 10
        };
        this.dropdown = new Foundation.Dropdown($(this.el), options);
    },
    onUnmount: function () {
        this.dropdown.destroy();
    },
    render: function (ctx, content) {
        return u("div.dropdown-pane.popover", ctx, content);
    }
});


function strutsFormMessage(form, ctx) {
    var messages = form.getNonFieldErrors();
    var failureMessage = form.getFailureMessage();
    var needsCallout = !form.isValid() && form.isBound() && (messages.length || failureMessage);
    return u("div.u-non-field-errors", {if: needsCallout, class: {"has-error": !form.isValid()}},
        u("div.u-form-errors",
            u("div.callout.alert",
                u("div.error-heading", {if: failureMessage}, failureMessage),
                u("ul", _.map(messages, function (msg) {
                    return u("li", msg.message);
                }))
            )
        )
    )
}


function strutsFormHiddenFields(form, ctx) {
    return _.map(form.getHiddenFields(), function (f) {
        return u("u-field", {name: f.name});
    });
}


function strutsFormRow(form, ctx, names) {
    names = arguments.length == 3 && _.isArray(names) ? names : _.slice(arguments, 2);
    return u(".row.medium-up-" + names.length,
        names.map(function (name) {
            var field = form.getField(name);
            var content = field ? u("u-field", {name: field.name, layout: ctx.layout || "vertical"}) : name;
            return u(".column", content);
        })
    )
}


function strutsFormActions(form, ctx, options) {
    options = options || {};
    var submit = options.submit || {label: "Save", icon: "save"},
        reset = options.reset;
    if (!submit && !reset) {
        return
    }
    var buttons = [];
    if (submit) {
        buttons.push(
            u("-button.button",
                {class: submit.class || 'primary'},
                u("i.fa", {if: submit.icon, class: "fa-" + submit.icon}),
                " ", submit.label
            )
        )
    }
    if (reset) {
        buttons.push(
            u("-button.button",
                {class: reset.class || 'primary'},
                i("i.fa", {if: reset.icon, class: "fa-" + reset.icon}),
                " ", reset.label
            )
        )
    }
    return u("div.u-form-actions.row.medium-up-1",
        u(".column",
            buttons
        )
    )
}


function strutsForm(form, ctx, attrs) {
    attrs = _.extend({form: form}, attrs);
    return u("u-form",
        attrs,
        strutsFormFields(form, ctx),
        strutsFormActions(form, ctx)
    )
}


function strutsFormFields(form, ctx) {
    var rows = [];
    rows.push(strutsFormHiddenFields(form, ctx));
    _.each(form.getVisibleFields(), function (field) {
        rows.push(strutsFormRow(form, ctx, field.name));
    })
    return rows;
}


function strutsFormLayout(form, ctx) {
    var rows = [], layout = _.slice(arguments, 1);
    _.each(layout, function (item) {
        rows.push(strutsFormRow(form, ctx, item));
    });
    return rows;
}


module.exports = {
    form: strutsForm,
    formRow: strutsFormRow,
    formActions: strutsFormActions,
    formFields: strutsFormFields,
    formHiddenFields: strutsFormHiddenFields,
    formLayout: strutsFormLayout,
    formMessage: strutsFormMessage
}