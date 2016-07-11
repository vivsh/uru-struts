"use strict";


var test = require("tape"),
    types = require("../struts/schema/types"),
    schema = require("../struts/schema/schema");


test("type inheritance", function (t) {

    var type = types.IntType({min: 0, max: 100, required: true, default: 8});

    t.ok(type instanceof types.Type);

    t.equal(8, type.options.default);

    var newType = type.update({default: 10});

    t.equal(newType.options.default, 10);

    t.end();
});

test("schema", function (t) {

    var sch = schema.Schema({
        age: types.IntType(),
        meta:{
            url: "/url/"
        }
    });

    console.log(sch);

    t.end();
})
