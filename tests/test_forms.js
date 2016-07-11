

var test = require("tape"),
    schema = require("../struts/schema");


var Form = schema.Form;
var Schema = schema.Schema;
var types = schema.types;
var ValidationError = schema.ValidationError;


test("form fields", function(t){
    var sch = Schema({
        total: types.IntType
    });

    var form  = new Form({schema: sch});

    t.equal(form.meta.fields.length, 1);

    t.end();
});

test("form set value", function(t){
    "use strict";
    var sch = Schema({
        total: types.IntType
    });

    var form  = new Form({schema: sch});

    form.total.value = 10;

    t.deepEqual(form.data, {total: 10});

    form.set({total: 100, age: 12});

    t.deepEqual(form.data, {total: 100, age: 12});

    t.end();
})


test.only("form clean", function(t){
    "use strict";

    var sch = Schema({
        total: types.IntType({min: 10}),
        age: types.IntType,
        password: types.StrType,
        passwordConfirm: types.StrType
    });

    class TestForm extends Form{

        validatePasswordConfirm(value, data){
            if(data["password"] && value != data['password']){
                throw new ValidationError("Duplicate password");
            }
        }

        getDefaults(){
            return {
                messages:{
                    validation: {
                        "age": {}
                    }
                }
            }
        }

    }

    var form  = new TestForm({schema: sch});

    form.set({total: 100, password: "hello", passwordConfirm: "heeee"});

    form.valid;

    var data = form.cleanedData;

    console.log(form.total.value);

    t.end();
})