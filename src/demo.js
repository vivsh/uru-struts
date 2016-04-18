
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
        return u("struts-form", {form: form},
            u("struts-field", {name: "age"}),
            u("struts-field", {name: "dob"}),
            u("struts-field", {name: "dod"}),
            u("struts-field", {name: "doy"}),
            u("struts-field", {name: "multiple_choices"}),
            u("struts-field", {name: "multiple_radio"}),
            u("struts-field", {name: "multiple_checkbox"}),
            u("struts-field", {name: "email"}),
            u("struts-field", {name: "phone"}),
            u("struts-field", {name: "good"}),
            u("struts-field", {name: "choices"}),
            u("struts-field", {name: "description"}),
            u("button.button.secondary", {type: "submit"}, "Submit")
        );
    }
});
