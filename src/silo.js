

var store = require("store2"), u = require("uru"), _ = require("lodash");


function Silo(prefix) {
    this.prefix = prefix;
    this.db = prefix ? store.namespace(prefix) : store;
    this.data = _.extend({}, this.db.getAll(), this.db.session.getAll(), global.UruStrutsData);
}

Silo.prototype = {
    constructor: Silo,
    get: function (key, defaultValue) {
        var payload = this.data[key];
        if(payload && (!payload.ttl || (payload.ttl > new Date().getTime()))){
            return payload.value;
        }else{
            return defaultValue || null;
        }
    },
    set: function (key, value, options) {
        options = options || {};
        var ttl = options.timeout ? new Date().getTime() : 0, initial = this.get(key);
        var payload = {value: _.cloneDeep(value), ttl: ttl};
        this.data[key] = payload;
        if(options.session){
            this.db.session(key, payload);
        }else if(options.local){
            this.db(key, payload);
        }
        if(!_.isEqual(value, initial)){
            this.trigger(key, {current: value, previous: initial});
        }
    }
};


u.emitter.enhance(Silo.prototype);

module.exports = Silo