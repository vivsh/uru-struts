
var URI = require("urijs"), u = require("uru");


function parseUri(url){
    "use strict";
    var uri = URI(url);
    return {
        path: uri.path(),
        query: uri.search(true),
        protocol: uri.protocol(),
        hostname: uri.hostname(),
        port: uri.port()
    };
}


function buildUri(values){
    "use strict";
    return URI(values.path)
        .hostname(values.hostname||"")
        .port(values.port)
        .query(values.query).toString();
}


function stripTags(content){
    "use strict";
    return $("<div/>").html(content).text();
}


function slugify(text){
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}


function Class(options){
    "use strict";
    options = options || {};
    var props  = options.properties;
    var statics = options.statics;
    var base = options.extends;

    var constructor = options.constructor || function(){
        base.apply(this, arguments);
    }

    constructor.prototype = Object.create(base.prototype, props);
    constructor.prototype.constructor = constructor;

    delete options.props;
    delete options.statics;
    delete options.extends;
    delete options.contructor;

    _.extends(constructor.prototype, options);
    _.extends(constructor, base, statics);

    return constructor;
}

module.exports = {
    buildUri: buildUri,
    parseUri: parseUri,
    isEqual: u.utils.isEqual,
    stripTags: stripTags,
    Class: Class,
    slugify: slugify
}
