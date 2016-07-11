
var URI = require("urijs"), _ = require("lodash");

function QueryDict(querystring) {
    var data = URI().search(querystring || location.search).search(true);
    this.data = {};
    var self = this;
    _.each(data, function (value, key) {
        if(!_.isArray(value)){
            value = [value];
        }
        self.data[key] = value;
    })
}

QueryDict.prototype = {
    constructor: QueryDict,
    encode: function () {

    },
    get: function(key){
        return this.data[key][0];
    },
    getList: function(){
        return this.data[key];
    },
    set: function (key, value) {
        this.data[key] = [value];
    },
    setList: function (key, value) {
        this.data[key] = value;
    },
    add: function (key, value) {
        this.data[key].push(value);
    },
    dict: function(){
        var result = {}, self = this;;
        _.each(this.data, function (value, key) {
            result[key] = self.get(key);
        });
        return result;
    },
    toString: function(){
        return this.encode();
    }
}