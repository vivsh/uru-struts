
var u = require("uru");

var mixinRegistry = {};

function mixin(name) {
    if(arguments.length == 1){
        return mixinRegistry[name];
    }else{
        return mixinRegistry[name] = arguments[1];
    }
}

module.exports = {
    mixin: mixin
}
