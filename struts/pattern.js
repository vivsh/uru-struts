

var RX_SEGMENT = /^(\w*)(\?)?:(.+?)(?:\s*\{\s*(\d*)\s*(?:,\s*(\d*))?\s*\})?$/;


var types = {
    alpha: {
        match: function(value){
            "use strict";
            return "alpha" === value;
        },
        pattern: function(value){
            "use strict";
            return "[a-zA-Z]+";
        }
    },
    alnum: {
        match: function(value){
            "use strict";
            return "alnum" === value;
        },
        pattern: function(value){
            "use strict";
            return "\\w+";
        }
    },
    int: {
        match: function(value){
            "use strict";
            return value in {'num': 1, 'int': 1};
        },
        pattern: function(value){
            "use strict";
            return "\\d+";
        },
        coerce: function(value){
            "use strict";
            return parseInt(value);
        }
    },
    any: {
        match: function(value){
            "use strict";
            return value === 'any';
        },
        pattern: function(value){
            "use strict";
            return '[^/]*';
        }
    },
    greedyAny: {
        match: function(value){
            "use strict";
            return value === '*';
        },
        pattern: function(value){
            "use strict";
            return '.*';
        }
    },
    choice: {
        match: function (value) {
            "use strict";
            return value.charAt(0) === '(' && value.charAt(value.length-1) === ')';
        },
        pattern: function(value){
            "use strict";
            var parts = value.substring(1, value.length-1).split(",");
            return parts.join("|");
        }
    },
    name: {
        match: function (value) {
            "use strict";
            return value === 'name';
        },
        pattern: function(){
            "use strict";
            return '[a-zA-Z]\\w+';
        }
    },
    slug:{
        match: function (value) {
            "use strict";
            return value == 'slug';
        },
        pattern: function (value) {
            "use strict";
            return '^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$';
        }
    }
};


function register(name, options){
    "use strict";
    types[name] = options;
}


function select(str) {
    "use strict";
    var key, value;
    for(key in types){
        if(types.hasOwnProperty(key) && (value = types[key]) && value.match(str)){
            return {pattern: value.pattern(str), coerce: value.coerce};
        }
    }
    return {pattern: str};
}


function regex(value, terminate, names, converters, segments){
    "use strict";
    var size = value.length, endSlash = "", slash;

    names = names || [];

    converters = converters || [];

    segments = segments || [];

    if(value.charAt(size-1) === '/'){
        endSlash = "/";
        value = value.substring(0, size-1);
    }

    var parts = value.split("/"), limit = parts.length, result = [], i, p, match, name, pattern,
        optional, high, low, range, count = 0, obj, tail = terminate ? "$" : "";

    for(i=0; i< limit; i++){
        p = parts[i];
        slash = i===limit-1 ? "" : "/";
        match = RX_SEGMENT.exec(p);
        if(match){
            name = match[1];
            optional = !!match[2] || match[3] === '*';
            obj = select(match[3]);
            pattern = obj.pattern;
            high = parseInt(match[4]);
            low = parseInt(match[5]);
            if(isNaN(high) && isNaN(low)){
                range = "";
            }else{
                range = "{" + low||"" + "," + high||"" + "}";
            }
            pattern = "(" + pattern + ")" + range;
            segments.push({name: name, index: count, regex: new RegExp(pattern), optional: optional});
            pattern = pattern + slash;
            if(optional){
                pattern = "(?:" + pattern + ")?";
            }
            result.push(pattern);
            names.push(name);
            converters.push(obj.coerce);
            count += 1;
        }else {
            result.push(p + slash);
            segments.push(p);
        }
    }

    if(endSlash){
        segments.push("");
    }

    return new RegExp("^" + result.join("") + endSlash + tail);
}


function parse(rx, args, converters, template){
    "use strict";
    var match = rx.exec(template), i, l, result = {}, value, limit = args.length, total = 0, func;
    if(match){
        l = match.length;
        for(i=0; i<l; i++){
            value = match[i+1];
            if(value !== undefined){
                ++total;
                if(i < limit){
                    func = converters[i];
                    if(typeof func === 'function'){
                        value = func(value);
                    }
                    result[args[i]] = value;
                }
                result[i] = value;
            }
        }
        result.$lastIndex = match[0].length;
        return result;
    }
    return false;
}


function createUrl(segments, args){
    "use strict";
    var i, limit = segments.length, part, result = [], value, actual;
    args = args || {};
    for(i=0; i < limit; i++){
        part = segments[i];
        if(typeof part === 'object'){
            actual = undefined;
            if(args.hasOwnProperty(part.name)){
                actual = args[part.name];
            }else if(args.hasOwnProperty(part.index)){
                actual = args[part.index];
            }
            if(actual === undefined){
                if(!part.optional){
                    return false;
                }
            }else{
                value = String(actual);
                if(!part.regex.test(value)){
                    return false;
                }
                result.push(value);
            }
        }else{
            result.push(part);
        }
    }
    return result.join("/");
}


function parser(value, terminate){
    "use strict";
    var segments = [], args = [], converters = [], rx = regex(value, terminate, args, converters, segments);

    var func = function (template) {
        return parse(rx, args, converters, template);
    };

    var reverse = function(values){
        return createUrl(segments, values);
    };

    func.regex = rx;

    func.reverse = reverse;

    return func;
}


module.exports = {
    parse: parser,
    register: register
};
