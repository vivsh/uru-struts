

function Model(data){
    "use strict";
    var meta = this.schema.meta;
    data = data || {};
    var types = meta.types, i, type;
    for(i=0; i< types.length; i++){
        type = types[i];
        this[type.name] = type.coerce(data[type.name]);
    }
}

Model.prototype = {
    constructor: Model,
    validate: function(){
        "use strict";

    },
    toJSON(){
        "use strict";
        
    }
}


function Collection(){
    "use strict";

}

module.exports = {
    Model: Model
}