"use strict";


var test = require("tape"),
    types = require("../struts/schema/types"),
    fields = require("../struts/schema/fields");


test("default value", function (t) {

    var type = new types.IntType({min: 0, max: 100, required: true, default: 8});
    var field = new fields.FormField(type);

    field.value = 1000;

    t.equal(field.value, 8)

    t.end();
});


test("initial validation", function (t) {
    var choices = [
        {value: 1, label: "First"},
        {value: 2, label: "Second"},
        {value: 3, label: "Third"},
        {value: 4, label: "Fourth"},
    ];
    var type = new types.IntType({required: true, choices: choices});
    var field = new fields.FormField(type);

    t.notOk(field.valid);

    type = new types.IntType({required: false, choices: choices});

    field = new fields.FormField(type);

    t.ok(field.valid);

    type = new types.IntType({required: true, choices: choices, default: 2});

    field = new fields.FormField(type);

    t.ok(field.valid);
    t.equal(field.value, 2);


    t.end();
});

test("validate choice", function (t) {
    var choices = [
        {value: 1, label: "First"},
        {value: 2, label: "Second"},
        {value: 3, label: "Third"},
        {value: 4, label: "Fourth"},
    ];
    var type = new types.IntType({required: true, default: 8, choices: choices});
    var field = new fields.FormField(type);

    field.value = 1000;

    t.notOk(field.valid)

    field.value = 3;

    t.ok(field.valid);

    t.end();
});