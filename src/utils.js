
var URI = require("urijs");


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


module.exports = {
    buildUri: buildUri,
    parseUri: parseUri
}
