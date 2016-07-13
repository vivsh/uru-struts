
var routes = require("./routes"), u = require("uru"), utils = u.utils, _ = require("lodash");
var conf = require("./conf"), http = require("./http");


function createHandler(self, value){
    "use strict";
    return function(params){
        self.set({component: value, params: params, error: false});
    };
}


function Entry(value, key){
    this.value = value;
    this.key = key;
}

Entry.prototype.join = function (other) {
    return this.key + other
}


var Router = u.Component.extend({
    routes: {},
    initialize: function () {
        "use strict";
        var root = "", links = [],
            stack = [new Entry(this.routes, root)],
            item, key, value, i, pattern, component, entry;
        while(stack.length){
            entry = stack.shift();
            item = entry.value;
            root = entry.key;
            if(utils.isPlainObject(item)){
                for(key in item){
                    if(item.hasOwnProperty(key)){
                        value = item[key];
                        stack.push(new Entry(value, entry.join(key)));
                    }
                }
            }else if(utils.isString(item)){
                pattern = root;
                routes.addLink(item, pattern);
                links.push(item);
            }else{
                throw new Error("Invalid routes");
            }
        }
        
        var pages = {}, self = this, i, value;
        for(i=0; i<links.length; i++){
            value = links[i];
            pages[value] = createHandler(this, value);
        }
        
        this.on("error", function(event){
            self.onError.apply(self, [event]);
        });

        this.on("mount", function(event){
            "use strict";
            if(event.source.getParent() === self && struts.isRouted(event.source.name)){
                self.processMount(self.request, event.source);
            }
        })

        this.on("unmount", function(event){
            "use strict";
            if(event.source.getParent() === self && struts.isRouted(event.source.name)){
                self.processUnmount(self.request, event.source);
            }
        });

        this.router = new routes.Router(pages, "");
        this.router.start();
    },
    getEnv: function(){

    },
    onError: function(event){
        this.set({error: event.data});
        u.redraw(true);
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
    processMount: function(request, obj){
        "use strict";
        var wares = this.getMiddlewares(request).slice(0), ware;
        for(var i=wares.length-1; i >= 0; i--){
            ware = wares[i];
            if(ware.processMount){
                ware.processMount(request, obj);
            }
        }
    },
    processUnmount: function (request, obj) {
        var wares = this.getMiddlewares(request).slice(0), ware;
        for(var i=wares.length-1; i >= 0; i--){
            ware = wares[i];
            if(ware.processUnmount){
                ware.processUnmount(request, obj);
            }
        }
    },
    processRequest: function(request){
        var wares = this.getMiddlewares(request).slice(0), response, ware;
        for(var i=0; i< wares.length; i++){
            ware = wares[i];
            if(ware.processRequest){
                response = ware.processRequest(request);
            }
            if(response){
                return response;
            }
        }
    },
    processResponse: function(request, response){
        var wares = this.getMiddlewares(request).slice(0), ware;
        for(var i=wares.length-1; i >= 0; i--){
            ware = wares[i];
            if(ware.processResponse){
                response = ware.processResponse(request, response);
            }
        }
        return this.transform(request, response);
    },
    getMiddlewares: function (request) {
        var middlewares = (this.middlewares || []).slice(0);
        return middlewares;
    },
    checkPermissions: function (request) {
        var view = u.component(request.pageName);
        var permissions = view ? view.prototype.permissions || this.permissions || [] : [], i, perm;
        for(i=0; i<permissions.length; i++){
            perm = permissions[i];
            if(!perm.test(request)){
                perm.action(request);
                break;
            }
        }
    },
    render: function(ctx){
        "use strict";
        var attrs = this.getEnv() || {}, response;
        attrs.params = ctx.params;
        ctx.url = attrs.url = location.href;
        var request = attrs;
        request.pageName = ctx.component;
        request.router = this;
        this.request = request
        if(ctx.error){
            response = this.renderError(ctx);
        }else{
            if (ctx.component) {
                response = this.processRequest(request);
                if (!response) {
                    this.checkPermissions(request);
                    this.onSwitch(ctx);
                    response = u(ctx.component, attrs);
                }
            } else {
                response = this.renderNotFound(ctx);
            }
        }
        return this.processResponse(request, response);
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

function scrollToFragment() {
    var hash = location.hash;
    if(hash && (hash = document.getElementById(hash.substr(1)))){
        hash.scrollIntoView();
    }
}

function Loader(name, component){
    "use strict";
    this.name = name;
    this.component = component;
    this.status = "ready";
    this.loading = 0;
    this.originalRender = component.render;
    component.on("unmount", function(){
       delete component[name];
    });
}

Loader.inject = function(component, name){
    "use strict";
    if(!name){
        name = "$loader";
    }
    component[name] = new Loader(name, component);
}

Loader.prototype.load = function (deferred, source, target, defaultValue) {
        var self = this;

        if(arguments.length === 2){
            target = source;
            source = "content";
        }else if(arguments.length === 3 && !utils.isString(target)){
            defaultValue = target;
            target = source;
            source  = "content";
        }

        if(this.loading === 0){
            this.status = "loading";
        }

        this.loading ++;

        if(utils.isString(deferred)){
            var url = routes.reverse(deferred) || deferred;
            deferred = http.get(url);
        }

        deferred.always(function(){
            "use strict";
            self.loading--;
            if(self.loading <= 0){
                self.status = "success";
            }
        }).done(function(data){
            "use strict";
            var obj = {};
            obj[target] = _.get(data, source);
            self.set(obj);
        }).fail(function(){
            "use strict";
            var obj = {$status: "error"};
            obj[target] = defaultValue;
            self.set(obj);
        });
    }

var View = u.Component.extend({
    $loading: 0,
    initialize: function(){
        "use strict";
        _.bindAll(this, "onLoad", "fetch");
        this.on("change:url", this.onLoad);
        this.onLoad();
    },
    onLoad: function () {
        this.fetch()
    },
    fetch: function(){
        "use strict";

    },
    delegate: function(func, args){
        var owner;
        while((owner = this.$owner) && !(owner[func]));
        return owner[func].call(owner, Array.prototype.slice(arguments, 1));
    },
    renderLoading: function (ctx) {
        return u("div.text-center", "Please wait ...")
    },
    renderError: function (ctx) {

    },
    render: function (ctx, content) {
        var status = ctx.$status;
        if(status === 'loading'){
            return this.renderLoading(ctx);
        }else if(status === 'error'){
            return this.renderError(ctx);
        }else{
            return this.getContent(ctx, content);
        }
    },
    load: function (deferred, source, target, defaultValue) {
        var self = this;

        if(arguments.length === 2){
            target = source;
            source = "content";
        }else if(arguments.length === 3 && !utils.isString(target)){
            defaultValue = target;
            target = source;
            source  = "content";
        }

        if(this.$loading === 0){
            this.set({$status: "loading"});
            // u.redraw();
        }

        this.$loading ++;

        if(utils.isString(deferred)){
            var url = routes.reverse(deferred) || deferred;
            deferred = http.get(url);
        }

        return deferred.always(function(){
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
            var obj = {$status: "error"};
            obj[target] = defaultValue;
            self.set(obj);
        });
    }
});


var Page = u.Component.extend({
    $loading: 0,
    initialize: function(){
        "use strict";
        _.bindAll(this, "onLoad", "fetch");
        this.on("change:url", this.onLoad);
        this.on("change:url", scrollToFragment);
        this.on("mount", scrollToFragment);
        this.onLoad();
    },
    getPageTitle: function () {
        return this.pageTitle;
    },
    onLoad: function () {
        this.fetch()
    },
    fetch: function(){
        "use strict";

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
        var pageClass = this.getPageClass(), title = this.getPageTitle();
        if(pageClass){
            $("body").addClass(pageClass);
        }
        if(title){
            $("title").first().html(title);
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

        if(arguments.length === 2){
            target = source;
            source = "content";
        }else if(arguments.length === 3 && !utils.isString(target)){
            defaultValue = target;
            target = source;
            source  = "content";
        }

        if(this.$loading === 0){
            this.set({$status: "loading"});
            // u.redraw();
        }

        this.$loading ++;

        if(utils.isString(deferred)){
            var url = routes.reverse(deferred) || deferred;
            deferred = http.get(url);
        }

        return deferred.always(function(){
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
            var obj = {$status: "error"};
            obj[target] = defaultValue;
            self.set(obj);
        });
    }
});


function page(name, obj){
    "use strict";
    var base;

    if(arguments.length <= 2){
        base = Page;
    }else{
        base = u.component(obj);
        obj = arguments[2];
    }

    var factory = u.component(name, base.extend(obj));

    return factory;
}


function view(name, obj){
    "use strict";
    var base;

    if(arguments.length <= 2){
        base = View;
    }else{
        base = u.component(obj);
        obj = arguments[2];
    }

    var factory = u.component(name, base.extend(obj));

    return factory;
}


module.exports = {
    router: router,
    page: page,
    pages: routes.links,
    Page: Page,
    view:view
}