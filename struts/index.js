
var forms = require("./forms"),
    fields = require("./fields"),
    utils = require("./utils"),
    validators = require("./validators"),
    http = require("./http"),
    routes = require("./routes"),
    router = require("./router"),
    widgets = require("./widgets"),
    $ = require("jquery"),
    u = require("uru"),
    fui = require("./fui"),
    conf = require("./conf");


module.exports = {
    u: u,
    Page: router.Page,
    View: router.View,
    Form: forms.Form,
    utils: utils,
    validators: validators,
    widget: widgets.widget,
    field: fields.field,
    http: http,
    currentPath: routes.currentPath,
    resolve: routes.resolve,
    reverse: routes.reverse,
    page: router.page,
    view: router.view,
    pages: router.pages,
    router: router.router,
    route: routes.route,
    mount: routes.mount,
    isRouted: routes.isRouted,
    fui: fui,
    setup: conf.setup,
    settings: conf.settings,
    services: conf.services,
    ready: conf.ready,
    static: conf.static,
    media: conf.media,
    context: conf.context
}

global.struts = module.exports;