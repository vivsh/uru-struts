
var forms = require("./src/forms"),
    fields = require("./src/fields"),
    utils = require("./src/utils"),
    validators = require("./src/validators"),
    http = require("./src/http"),
    routes = require("./src/routes"),
    router = require("./src/router"),
    widgets = require("./src/widgets"),
    $ = require("jquery");


function runStruts() {
    $(function () {
        routes.mount();
    });
}


if(window){
    runStruts();
}

module.exports = {
    Form: forms.Form,
    utils: utils,
    validators: validators,
    widget: widgets.widget,
    field: fields.field,
    utils: utils,
    http: http,
    currentPath: routes.currentPath,
    resolve: routes.resolve,
    reverse: routes.reverse,
    page: router.page,
    pages: router.pages,
    router: router.router,
    route: routes.route,
    mount: routes.mount,
    isRouted: routes.isRouted
}