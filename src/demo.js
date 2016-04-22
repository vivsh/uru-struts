
var u = require("uru"), struts = require("./index"), $ = require("jquery");


var WeekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
                "Saturday", "Sunday"].map(function(k,i){
                "use strict";
                return {value: i, label: k};
});


var TrialForm = struts.Form.extend({
    fields:{
        age: {type: "integer", label: "Age", min: 0, max: 100, required: true},
        dob: {type: "date", label: "Date of Birth"},
        dod: {type: "date", label: "Date of Death", widget:"foundation-datepicker"},
        doy: {type: "datetime", label: "Date of Youth", widget:"foundation-datetimepicker"},
        good: {type: "boolean", label: "Good"},
        email: {type: "email", label: "Email"},
        phone: {type: "phone", label: "Phone", required: true},
        multiple_checkbox: {
            type: "multiple-choice", label: "Checkbox Choice", choices: WeekDays, widget: "multiple-checkbox"
        },
        multiple_radio: {
            type: "choice", label: "Radio Choice", choices: WeekDays, widget: "multiple-radio"
        },
        choices: {
            type: "choice",
            label: "Choice",
            choices: WeekDays
        },
        multiple_choices: {
            type: "multiple-choice",
            label: "Choices",
            choices: WeekDays
        },
        description: {type: "text", label: "Description", required: true, rows: 10},
    }
});


u.component("trial-form", {
    initialize: function(){
        "use strict";
        this.form = new TrialForm();
    },
    render: function () {
        var form = this.form;
        return u("u-form", {form: form},
            u("u-field", {name: "age"}),
            u("u-field", {name: "dob"}),
            u("u-field", {name: "dod"}),
            u("u-field", {name: "doy"}),
            u("u-field", {name: "multiple_choices"}),
            u("u-field", {name: "multiple_radio"}),
            u("u-field", {name: "multiple_checkbox"}),
            u("u-field", {name: "email"}),
            u("u-field", {name: "phone"}),
            u("u-field", {name: "good"}),
            u("u-field", {name: "choices"}),
            u("u-field", {name: "description"}),
            u("button.button.secondary", {type: "submit"}, "Submit")
        );
    }
});
