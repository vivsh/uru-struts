

var u = require("uru"), _ = require("lodash");


function DataTable(data, options) {
    this.options = _.defaults({}, options, this.options);
    this.data = data;
}

DataTable.prototype = {
    constructor: DataTable,
    extend: u.utils.extend,
    render: function(ctx){
        
    }
}

DataTable.extend({
    columns: [
        {name: "something", type: "", format: "", label: ""},
    ]
})


module.exports = {
    DataTable: DataTable
};