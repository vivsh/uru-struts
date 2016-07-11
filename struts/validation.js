


function validateField(value, validators, errors, callback){
    if(errors.length || validators.length === 0){
        callback(value, errors);
    }else{
        var validator = validators.shift(), async = null;
        try {
            validator(value, function (promise) {
                async = promise;
            });
        }catch(e){
            errors.push(e);
        }
        if(async){
            async.fail(function (e) {
                errors.push(e);
            }).always(function () {
                validateField(value, validators, errors, callback);
            });
        }else{
            validateField(value, validators, errors, callback);
        }
    }
}

 function validateSchema(form, fieldSet, data, errors, next) {
     if(!fieldSet.length){
         if(form.isValid()){
            validateField(data, validators, errors, next);
         }else{
            next(data, errors);
         }
     }else{
         var field = fieldSet.shift();
         var callback = function(){
             if(field.isValid()){
                data[field.name] = field.getValue();
             }
            validateSchema(form, fieldSet, data, validators, errors, next);
         };
         if(field.isBound()){
             field.callWhenReady(callback);
         }else{
             field.setValue(field.getValue(), callback);
         }
     }
 }

