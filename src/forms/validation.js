

 function validateGt50(value, cb){
    if(value > 50){
        cb(value);
    }else{
        cb(value, "Value should be more than 50");
    }
 }

 function validateGt90(value, cb){
    if(value > 90){
        cb(value);
    }else{
        cb(value, "Value should be more than 90");
    }
 }

 function testValidation(callback) {
    var errors = [], validators = [validateGt50, validateGt90];
    validate(700, validators, errors, callback);
 }


 testValidation(function(value, errors){
     console.log(value, errors);
 })