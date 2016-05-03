
var _ = require("lodash");


function Model(values, cursor){
    this.$data = {};
    this.$cursor = cursor;
    Object.freeze(this);
}

Model.extend = u.utils.extend;

Model.initialize = function () {
    var key, value, props = [], prototype = this.prototype;
    var rxGetter = /^get[A-Z]/, rxSetter = /^set[A-Z]/;
    for(key in prototype){

    }
}

Model.prototype = {
    extend: u.utils.extend,
    $update: function (values, silent) {
        var data = this.$data, value, initial, dirty = false;
        for(var key in values){
            if(values.hasOwnProperty(key)){
                value = values[key];
                initial = data[key];
                if(!_.isEqual(initial, value)){
                    dirty = true;
                    data[key] = value;
                }
            }
        }
        if(dirty && this.$cursor){
            this.$cursor();
        }
    }
}