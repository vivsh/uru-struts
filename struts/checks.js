
var RX_INDIAN_MOBILE_PHONE_NUMBER =  /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?([789]\d{9}|(\d[ -]?){10}\d)$/;

var RX_EMAIL =  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


function isEmail(value){
    "use strict";
    return RX_EMAIL.test(value);
}


function isIndianMobilePhoneNumber(value){
    "use strict";
    return RX_INDIAN_MOBILE_PHONE_NUMBER.test(value);
}


function isPhoneOrEmail(value){
    return isEmail(value) || isIndianMobilePhoneNumber(value);
}


function isPattern(value, patterns) {
    if(!u.utils.isArray(value)){
        patterns = [patterns];
    }
    for(var i=0; i < patterns.length; i++){
        if(patterns[i].test(value)){
            return true;
        }
    }
    return false;
}


function isDigits(value){
    return isPattern(value, [/^\d+$/]);
}


function isNumber(value){
    return !isNaN(value);
}


function isInteger(value){
    return /[+\-]?\d+/.test(value);
    // return String(parseInt(value)) === value;
}


function isFloat(value){
    return String(parseFloat(value)) === value;
}

function isEmpty(value){
    "use strict";
    if(value ==null){
        return false;
    }
    if(u.utils.isArray(value) || u.utils.isString(value)){
        return value.length === 0;
    }else if(u.utils.isPlainObject(value)){
        for(var key in value){
            if(value.hasOwnProperty(key)){
                return false;
            }
        }
        return true;
    }else {
        return !!value;
    }
}


module.exports = {
    isPhoneOrEmail: isPhoneOrEmail,
    isEmail: isEmail,
    isPattern: isPattern,
    isPhone: isIndianMobilePhoneNumber,
    isDigits: isDigits,
    isInteger: isInteger,
    isFloat: isFloat,
    isNumeric: isNumber,
    isEmpty: isEmpty
}