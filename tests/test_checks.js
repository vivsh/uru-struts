

var test = require("tape"), checks = require("../checks");


test("is integer", function(t){
    t.ok(checks.isInteger("-1000"));
    t.ok(checks.isInteger("0"));
    t.ok(checks.isInteger("+1000"));
    t.end();
});