


var Chart = require("chart.js"), u = require("uru"), _ = require("lodash");


u.component("time-series-chart", {
    context: {
        backgroundColor: "rgba(75, 95, 115, 0.25)",
        borderWidth: 1
    },
    plot: function(ctx){
        "use strict";
        var el = this.el;
        var points = ctx.data;
        this.chart = new Chart(el, {
            type: 'line',
            data: {
                labels: _.map(points, function(o){
                    return o.x;
                }),
                datasets: [{
                    label: ctx.xLabel,
                    data: _.map(points, function (o) {
                        return o.y;
                    }),
                    backgroundColor: ctx.backgroundColor,
                    borderWidth: ctx.borderWidth
                }]
            },
            options: {
                title: {
                    text: ctx.title,
                    display: !!ctx.title
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            tooltipFormat: "d, MMM YYYY",
                            displayFormats: {
                                quarter: 'MMM YYYY'
                            },

                        },
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero:false
                        }
                    }]
                }
            }
        });
    },
    onMount: function () {
        this.plot(this.context);
    },
    onUnmount: function () {
        this.chart.destroy();
    },
    render: function (ctx) {
        return u("canvas", {});
    }
})