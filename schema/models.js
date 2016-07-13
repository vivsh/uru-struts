

function Model(data){
    "use strict";
    var key;
    for(key in data){
        if(data.hasOwnProperty(key)){
            this[key] = data[key];
        }
    }
}

Model.prototype = {
    constructor: Model,
    validate: function(){
        "use strict";

    },
    toJSON: function () {

    }
}


module.exports = {
    Model: Model
}