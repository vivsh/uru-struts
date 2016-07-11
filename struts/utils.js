
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


module.exports = {
    buildUri: buildUri,
    parseUri: parseUri,
    isEqual: u.utils.isEqual,
    stripTags: stripTags
}
