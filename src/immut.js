
function isEqual(a, b) {

}

function Silo(){
    this._values = {};
    this._cursor = null;
}

Silo.prototype = {
    set: function(object){
        var initial, value, data = this._values, dirty = false, result = {}, cursor;
        for(var key in object){
            if(object.hasOwnProperty(key)){
                initial = data[key];
                value = object[key];
                result[key] = value;
                if(initial !== value){
                    dirty = true;
                }
            }
        }
        if(dirty){
            this._values = result;
        }
        if((cursor = this._cursor)){
            cursor.parent.set(cursor.id, value);
        }
    },
    get: function () {
        return this._values;
    }
}