
var u = require("uru"), _ = require("lodash"), URI = require("urijs");


u.component("panel", function (ctx, content) {
    var attrs = _.omit(ctx, ['title', 'buttons']);
    return u(".panel", attrs,
        u(".panel-heading", {if: ctx.title}, ctx.title),
        u(".panel-body",
            content
        )
    );
});


u.component("breadcrumbs", function (ctx, content) {
    var links = ctx.links;
    delete ctx.links;
    ctx.role = "navigation";
    ctx['aria-label'] = "You are here";
    return u("nav", ctx,
        u("ul.breadcrumbs",
            links.map(function (ln) {
                var active = ln.url === location.pathname;
                return u("li",
                    u("a", {href: ln.url, if: !active}, ln.label),
                    u("span", {if: active}, ln.label)
                );
            })
        )
    );
});


u.component("pagination", function (ctx) {

    var uri = new URI(ctx.baseUrl||location.href),
        parameter = ctx.parameter || "page",
        current = parseInt(uri.search(true)[parameter] || 1),
        first = ctx.first || 1,
        last = ctx.total,
        hasPrevious = current > first,
        hasNext = current < last;
    var attrs = _.omit(ctx, ['first', 'last', 'parameter', 'baseUrl', 'total']);
    attrs.role = 'navigation';
    var pageNumbers = _.range(first, last+1);

    var href = function (no) {
        var obj = {};
        obj[parameter] = "" + no;
        return uri.search(obj).toString();
    };
    if(last===first){
        return;
    }
    return u("ul.pagination", attrs,
        u("li.pagination-previous", {class: {disabled: !hasPrevious}},
            u("a", {if: hasPrevious, href: href(current-1)}),
            u("span.show-for-sr", {if: !hasPrevious}, "page")
        ),
        pageNumbers.map(function (no) {
            var url = href(no);
            var active = no === current;
            return u("li", {class: {current: active}},
                u("a", {href: href(no), if: !active}, no),
                u("span.show-for-sr", {if: active}, "You're on page"),
                u("span", {if: active}, no)
            )
        }),
        u("li.pagination-next", {class: {disabled: !hasNext}},
            u("a", {if: hasNext, href: href(current+1)}),
            u("span.show-for-sr", {if: !hasNext}, "page")
        )
    );
});


var DataTable = u.Component.extend({
    initialize: function (ctx) {
        this.columns = _.cloneDeep(this.columns);
    },
    getRowData: function(values, i){
        "use strict";
        var columns = this.columns;
        return _.map(columns, function(col){
            "use strict";
            var name = col.name, value;
            var formatName = col.format;
            var key = col.key || name;
            if(_.isFunction(key)){
                value = key(values);
            }else{
                value = _.get(values, key);
            }
            if(formatName) {
                if (_.isFunction(formatName)) {
                    value = formatName(value);
                } else {
                    value = self[formatName] ? self[formatName](value) : formats.format(value, formatName);
                }
            }
            return value;
        });
    },
    renderRow: function (values, i) {
        var columns = this.columns, self = this;
        return u("tr",
            _.map(self.getRowData(values, i), function(value, j){
                "use strict";
                var name = columns[j].name;
                return u("td.col-"+name, value);
            })
        );
    },
   render: function (ctx) {
       var name = this.name;
       var self = this;
       var columnLabels = _.map(this.columns, function(o){ return u("th.col-"+o.name, o.label || _.capitalize(o.name))});
       var dataset = ctx.data;
       return u("table.data-table", {class: name},
            u("thead",
                u("tr",
                    columnLabels
                )
            ),
           u("tbody",
                _.map(dataset, function(row, i){ return self.renderRow(row, i)})
           )
       )
   }
});

u.component("datatable", DataTable);