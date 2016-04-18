
var Chartist = require("chartist"), u = require("uru");

u.component("chart", {
    onMount: function () {
        var ctx = this.context;
        var data = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          series: [
            [5, 2, 4, 2, 0]
          ]
        };
        var options = {
          // axisX: {
          //   showGrid: false,
          //   showLabel: false,
          //   offset: 0
          // },
          // axisY: {
          //   showGrid: false,
          //   // showLabel: false,
          //   // offset: 0
          // }
        };
        this.chart = new Chartist.Line(this.el, data, options);
    },
    onUnmount: function () {
        this.chart.detach();
    },
    render: function () {
        return u("div.ct-perfect-fourth");
    }
})