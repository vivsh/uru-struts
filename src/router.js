
var routes = require("./routes"), u = require("uru"), utils = u.utils;



function createHandler(self, value){
    "use strict";
    return function(params){
        self.set({component: value, params: params, error: false});
    };
}

var Router = u.Component.extend({
    root: "",
    routes: [

    ],
    initialize: function () {
        "use strict";
        this.once = 0;
        var pages = {}, self = this, i, defined = this.routes, value;
        for(i=0; i<defined.length; i++){
            value = defined[i];
            pages[value] = createHandler(this, value);
        }
        this.on("error", function(event){
            self.onError.apply(self, [event]);
        });
        this.router = new routes.Router(pages, this.root);
        this.router.start();
    },
    getEnv: function(){

    },
    onError: function(event){
        this.set({error: event.data});
        u.nextTick(u.redraw);
    },
    onUnmount: function () {
        "use strict";
      this.router.stop();
    },
    onSwitch: function(ctx){
        "use strict";
    },
    transform: function (ctx, content) {
        return content;
    },
    render: function(ctx){
        "use strict";
        if(ctx.error){
            return this.renderError(ctx);
        }
        this.onSwitch(ctx);
        if(ctx.component){
            var attrs = this.getEnv() || {};
            attrs.params = ctx.params;
            return this.transform(ctx, u(ctx.component, attrs));
        }else{
            return this.transform(ctx, this.renderNotFound(ctx));
        }
    },
    renderRedirect: function (ctx) {
        return u("small", "Redirecting ...");
    },
    renderError: function (ctx) {
        return u("h1", "Oops! Error happened. Please try again after sometime");
    },
    renderLoading: function (ctx) {
        return u("loader");
    },
    renderNotFound: function(ctx){
        "use strict";
        return u("h1", "Oops ! Not found !!!!");
    }
});


function router(name, definition){
    "use strict";
    var result = u.component(name, Router.extend(definition));
    return result;
}

var Page = u.Component.extend({
    $loading: 0,
    prepare: function(ctx){

    },
    getPageClass: function () {
        "use-strict";
        return this.pageClass;
    },
    redirect: function(url, replace){
        this.set({$status: "redirect"});
        routes.route(url, {replace: !!replace});
    },
    delegate: function(func, args){
        var owner;
        while((owner = this.$owner) && !(owner[func]));
        return owner[func].call(owner, Array.prototype.slice(arguments, 1));
    },
    onMount: function(){
        var pageClass = this.getPageClass();
        if(pageClass){
            $("body").addClass(pageClass);
        }
    },
    onUnmount: function(){
        var pageClass = this.getPageClass();
        if(pageClass){
            $("body").removeClass(pageClass);
        }
    },
    render: function (ctx, content) {
        var status = ctx.$status;
        this.prepare(ctx);
        if(status === 'loading'){
            return this.delegate("renderLoading", ctx);
        }else if(status === 'redirect'){
            return this.delegate("renderRedirect", ctx)
        }else if(status === 'error'){
            return this.delegate("renderError", ctx)
        }else{
            return this.getContent(ctx, content);
        }
    },
    load: function (deferred, source, target, defaultValue) {
        var self = this;

        if(this.$loading === 0){
            this.set({$status: "loading"});
            u.redraw();
        }

        this.$loading ++;

        deferred.always(function(){
            "use strict";
            self.$loading--;
            if(self.$loading<=0){
                self.set({$status: "success"});
            }
        }).done(function(data){
            "use strict";
            var obj = {};
            obj[target] = _.get(data, source);
            self.set(obj);
        }).fail(function(){
            "use strict";
            var obj = {};
            obj[target] = defaultValue;
            self.set(obj);
        });
    }
});


function page(name, obj){
    "use strict";
    var base;

    if(obj.pattern === null || obj.pattern === undefined){
        throw new Error("No url pattern defined for " + name);
    }

    if(arguments.length <= 2){
        base = Page;
    }else{
        base = u.component(obj);
        obj = arguments[2];
    }

    var factory = u.component(name, base.extend(obj));

    routes.addLink(name, obj.pattern, factory);

    return factory;
}



module.exports = {
    router: router,
    page: page,
    pages: routes.links,
    Page: Page
}