

function notifyOnChange(cursor) {
    cursor.parent.update()
}



function uruMerge(source, target, changes){
    var key, value, initial, dirty = false, idKey, type, isObject;
    var uruIdKey = '$uruId'
    for(key in target){
        if(target.hasOwnProperty(key)){
            initial = source[key];
            value = target[key];
            idKey = key+ uruIdKey;
            isObject = typeof value === 'object';
            if(initial !== value || (isObject && value[uruIdKey] != source[idKey])){
                source[key] = value;
                dirty = true;
                if(changes){
                    changes[key] = value;
                }
                if(isObject && value[uruIdKey]){
                    source[idKey] = value[uruIdKey];
                }
            }
        }
    }
    return dirty;
}


function Cursor(data){

}

function createCursor() {

}

function ValueCursor(data, parent, key){
    this._data = data;
}

ValueCursor.prototype = {
    constructor: ValueCursor,
    get: function () {
        return this._data;
    },
    toJS: function () {
        return this._data.toJS();
    },
    set: function (value) {
        this._data = value;
    }
}

function ListCursor(data, updater){
    this._data = data;
    this._updater = updater;
}


ListCursor.prototype = {
    constructor: ListCursor,
    set: function (index, value) {
        this._data[index] = new ListCursor(value);
        this._updater(new ListCursor(this._data))
    },
    get: function (index, value) {
        return this._data[index];
    },
    toJS: function () {

    },
    pop: function () {

    },
    shift: function () {

    },
    batch: function (callback) {

    }
}