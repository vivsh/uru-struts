var u = require("uru"), _ = require("lodash");

var widgetRegistry = {};


var Widget = u.Component.extend({
    constructor: function () {
        "use strict";
        var self = this;
        u.Component.apply(this, arguments);
        var func = this.valueChanged;
        this.valueChanged = _.debounce(function () {
            return func.apply(self, arguments);
        }, 250, {leading: true});
    },
    readValue: function () {
        return u.dom.getValue(this.el);
    },
    valueChanged: function () {
        var field = this.context.field;
        var value = this.readValue();
        field.setValue(value);
        u.redraw();
    }
});


function registerWidget(name, options) {
    "use strict";
    if (arguments.length > 1) {
        var base = Widget;
        if (arguments.length === 3) {
            options = arguments[2];
            base = widgetRegistry[arguments[1]];
        }
        if (name in widgetRegistry) {
            throw new Error("Widget already registered: " + name);
        }
        var factory = base.extend(options);
        widgetRegistry[name] = factory
        factory.prototype.type = name;
    } else {
        if (!(name in widgetRegistry)) {
            throw new Error("Widget not found: " + name);
        }
        return widgetRegistry[name];
    }
}


function getWidgetAttributes(widget, extras) {
    "use strict";
    var field = widget.context.field;
    return _.extend({
        class: field.class,
        placeholder: field.placeholder,
        name: field.name,
        id: field.id,
        onaction: widget.valueChanged
    }, extras);
}


function input(type) {
    "use strict";
    return {
        render: function (ctx) {
            var field = ctx.field;
            return u("input",
                getWidgetAttributes(this, {value: field.getValue(), type: type, onfocusout: this.valueChanged})
            );
        }
    };
}

(function () {
    "use strict";
    var basicInputs = {
        string: "text",
        password: "password",
        number: "number",
        date: "date",
        time: "time",
        email: "email",
        url: "url",
        file: "file",
        image: "image",
        datetime: "datetime-local",
        month: "month",
        color: "color",
        phone: "tel",
        search: "search",
    };
    var key;
    for (key in basicInputs) {
        if (basicInputs.hasOwnProperty(key)) {
            registerWidget(key, input(basicInputs[key]));
        }
    }
})();


registerWidget("checkbox", {
    render: function (ctx) {
        var field = ctx.field;
        var attrs = getWidgetAttributes(this, {
            checked: field.getValue(),
            value: "true",
            type: "checkbox",
            onaction: this.valueChanged
        });
        return u("label", {class: "u-form-label", for: field.id},
            u("input", attrs),
            field.label
        );
    },
    statics: {
        verticalLayout: function (ctx) {
            return [
                ctx.widget,
                ctx.help,
                ctx.errors
            ]
        }
    }
});


registerWidget("hidden", {
    hidden: true,
    render: function (ctx) {
        var field = ctx.field;
        var attrs = getWidgetAttributes(this, {value: field.getValue(), type: "hidden", onfocusout: null});
        return u("input", attrs);
    },
    statics: {
        verticalLayout: function (ctx) {
            return [
                ctx.widget
            ]
        },
        horizontalLayout: function (ctx) {
            "use strict";
            return ctx.widget
        },
        inlineLayout: function (ctx) {
            "use strict";
            return ctx.widget
        }
    }
});


registerWidget("select", {
    context: {
        emptyLabel: "Nothing Selected"
    },
    render: function (ctx) {
        "use strict";
        var field = ctx.field;
        var choices = _.map(field.choices, function (item) {
            return u("option", {value: item.value, selected: item.value === field.getValue()}, item.label);
        });
        if (!field.required) {
            var label = ctx.emptyLabel;
            choices.unshift(u("option", {value: ''}, label));
        }
        var attrs = getWidgetAttributes(this);
        return u("select", attrs, choices);
    }
});


registerWidget("text", {
    render: function (ctx) {
        "use strict";
        var field = ctx.field;
        var attrs = getWidgetAttributes(this, {rows: field.options.rows, value: field.getValue()});
        return u("textarea", attrs);
    }
});


registerWidget("foundation-datepicker", {
    onMount: function () {
        "use strict";
        $(this.el).fdatepicker({
            format: 'dd MM, yyyy',
            disableDblClickSelection: true
        }).on("changeDate", this.valueChanged);
    },
    onUnmount: function () {
        "use strict";
        $(this.el).fdatepicker("remove");
    },
    render: function (ctx) {
        "use strict";
        var field = ctx.field;
        var attrs = getWidgetAttributes(this, {value: field.getValue(), type: "text"});
        return u("input", attrs);
    }
});


registerWidget("foundation-datetimepicker", {
    onMount: function () {
        "use strict";
        $(this.el).fdatepicker({
            format: 'dd/mm/yyyy hh:mm',
            pickTime: true,
            disableDblClickSelection: true
        }).on("changeDate", this.valueChanged);
    },
    onUnmount: function () {
        "use strict";
        $(this.el).fdatepicker("remove");
    },
    render: function (ctx) {
        "use strict";
        var field = ctx.field;
        var attrs = getWidgetAttributes(this, {value: field.getValue(), type: "text"});
        return u("input", attrs);
    }
});


registerWidget("multiple-select", {
    render: function (ctx) {
        "use strict";
        var field = ctx.field;
        var choices = _.map(field.choices, function (item) {
            return u("option", {
                value: item.value,
                selected: _.includes(field.getValue(), item.value)
            }, item.label);
        });
        var attrs = getWidgetAttributes(this, {multiple: true});
        return u("select", attrs, choices);
    }
});


registerWidget("multiple-checkbox", {
    readValue: function () {
        "use strict";
        var result = [], name = this.context.field.name;
        $("input[name='" + name + "']", this.el).each(function (i, el) {
            if (el.checked) {
                result.push(el.value);
            }
        });
        return result;
    },
    render: function (ctx) {
        "use strict";
        var field = ctx.field;
        var choices = _.map(field.choices, function (item, i) {
            var id = field.id + "-" + i;
            return u("li",
                u("input", {
                    id: id, value: item.value, type: "checkbox", name: field.name,
                    checked: _.includes(field.getValue(), item.value)
                }),
                u("label", {for: id}, item.label)
            );
        });
        return u("ul", {id: field.id, onchange: this.valueChanged}, choices);
    }
});


registerWidget("multiple-radio", {
    readValue: function () {
        "use strict";
        var result = [], name = this.context.field.name;
        $("input[name='" + name + "']", this.el).each(function (i, el) {
            if (el.checked) {
                result.push(el.value);
            }
        });
        return result[0];
    },
    render: function (ctx) {
        "use strict";
        var field = ctx.field;
        var choices = _.map(field.choices, function (item, i) {
            var id = field.id + "-" + i;
            return u("li",
                u("label",
                    u("input", {
                        id: id, value: item.value, type: "radio", name: field.name,
                        checked: _.includes(field.getValue(), item.value)
                    }),
                    item.label
                )
            );
        });
        return u("ul", {id: field.id, onchange: this.valueChanged}, choices);
    }
});


module.exports = {
    widget: registerWidget
}