

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


function validateEmail(message) {
    return function (value, next) {
        if(!isEmail(value)){
            throw new Error(message);
        }
        next();
    }
}


function validateRegex(pattern, message){
    "use strict";
    var pattern = pattern instanceof RegExp? pattern : new RegExp(pattern);
    return function (value, next) {
        if(!pattern.test(value)){
            throw new Error(message);
        }
        next();
    };
}

function validateIndianPhone(message){
    "use strict";
    var pattern = RX_INDIAN_MOBILE_PHONE_NUMBER;
    return function (value, next) {
        if(!pattern.test(value)){
            throw new Error(message);
        }
        next();
    }
}

module.exports = {
    isEmail: isEmail,
    isIndianMobilePhoneNumber: isIndianMobilePhoneNumber,
    validateEmail: validateEmail,
    validatePattern: validateRegex,
    validateIndianPhoneNumber: validateIndianPhone,
}