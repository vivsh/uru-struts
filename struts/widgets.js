var u = require("uru"), _ = require("lodash"), utils = require("./utils");

var widgetRegistry = {};


var Widget = u.Component.extend({
    constructor: function (ctx) {
        "use strict";
        var self = this;
        u.Component.apply(this, arguments);
        var func = this.valueChanged;
        this.valueChanged = _.debounce(function () {
            return func.apply(self, arguments);
        }, 500, {leading: true});
        this.lastValue = ctx.field.data;
    },
    selectionDict: function() {
        var result = {}, field = this.context.field;
        var data = field.data;
        if(!_.isArray(data)){
            data =[data];
        }
        _.each(data, function (value) {
            result[value] = value;
        })
        return result;
    },
    readValue: function (event) {
        var el = (event && event.target) ? event.target: this.el;
        return u.dom.getValue(el);
    },
    onValueChange: function(value){

    },
    valueChanged: function (event) {
        var field = this.context.field;
        var value = this.readValue(event);
        if(utils.isEqual(value, this.lastValue)){
            return;
        }
        this.lastValue = value;
        field.setValue(value);
        field.setBound(true);
        this.onValueChange(value);
        u.redraw();
        return;
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
    var ctx = widget.context;
    var field = ctx.field;
    return _.extend({
        class: field.class,
        placeholder: ctx.placeholder,
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
                getWidgetAttributes(this, {value: field.data, type: type, onfocusout: this.valueChanged})
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

registerWidget("file").prototype.multipart = true;

registerWidget("checkbox", {
    readValue: function (event) {
        var el = (event && event.target) ? event.target: this.el;
        return u.dom.getValue(el) || 'false';
    },
    render: function (ctx) {
        var field = ctx.field;
        var attrs = getWidgetAttributes(this, {
            checked: field.data,
            value: field.initial || "true",
            type: "checkbox",
            onaction: this.valueChanged
        });
        return u("label", {class: "u-form-label", for: field.id},
            u("input", attrs),
            field.label
        );
    },
    statics: {
        inlineLayout: function (ctx) {
            return [
                ctx.widget,
                ctx.help,
                ctx.errors
            ]
        },
        verticalLayout: function (ctx) {
            return [
                ctx.widget,
                ctx.help,
                ctx.errors
            ]
        }
    }
});


registerWidget("multiple-file", {
    multipart: true,
    render: function (ctx) {
        var field = ctx.field;
        var attrs = getWidgetAttributes(this, {value: field.data, type: "file", multiple: true, onfocusout: null});
        return u("input", attrs);
    }
});


registerWidget("hidden", {
    hidden: true,
    render: function (ctx) {
        var field = ctx.field;
        var attrs = getWidgetAttributes(this, {value: field.data, type: "hidden", onfocusout: null});
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
            return u("option", {value: item.value, selected: item.value == field.data}, item.label);
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
        var attrs = getWidgetAttributes(this, {rows: field.options.rows, value: field.data});
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
        var attrs = getWidgetAttributes(this, {value: field.data, type: "text"});
        return u("input", attrs);
    }
});


registerWidget("foundation-datetimepicker", {
    onMount: function () {
        "use strict";
        $(this.el).fdatepicker({
            format: 'dd/mm/yyyy hh:ii',
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
        var attrs = getWidgetAttributes(this, {value: field.data, type: "text"});
        return u("input", attrs);
    }
});


registerWidget("split-date", {
   select: function (name, choices) {
        return u("select", {onaction: this.valueChanged, name: name},_.map(choices, function(label, value){
            return u("option", {value: value}, label)
        }));
   },
    readValue: function () {
        return
    },
   render: function (ctx) {
       var field = ctx.field;
       var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
            "October", "November", "December"
       ];
       return u("div",
            this.select(_.range(1, 31)),
            this.select(months),
            this.select(_.range(2018, 1900, -1))
       );
   }
});


registerWidget("multiple-select", {
    render: function (ctx) {
        "use strict";
        var field = ctx.field;
        var choiceDict = this.selectionDict();
        var choices = _.map(field.choices, function (item) {
            return u("option", {
                value: item.value,
                selected: item.value in choiceDict
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
        var choiceDict = this.selectionDict();
        var choices = _.map(field.choices, function (item, i) {
            var id = field.id + "-" + i;
            return u("li",
                u("input", {
                    id: id, value: item.value, type: "checkbox", name: field.name,
                    checked: item.value in choiceDict
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
        var field = ctx.field, value = String(field.data);
        var choices = _.map(field.choices, function (item, i) {
            var id = field.id + "-" + i;
            return u("li",
                u("label",
                    u("input", {
                        id: id, value: item.value, type: "radio", name: field.name,
                        checked: value == item.value
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