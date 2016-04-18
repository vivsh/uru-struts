

var pattern = require("./pattern"), utils = require("./utils"), dom = require("./dom");

var routerSet = [], monitorRoutes = false, initialRoutePopped = false, firstRoute = true, links = [], previousRoute;


function normalizePathName(pathname){
    "use strict";
    if(pathname.charAt(0) === '/'){
        pathname = pathname.substr(1);
    }
    return pathname;
}

function handleRoute(event){
    "use strict";
    var pathname = normalizePathName(window.location.pathname), href = window.location.href;
    if(href === previousRoute){
        return;
    }
    var result = matchRoute(pathname);
    if(result){
        firstRoute = false;
        if(event) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
        result.func(result.args);
    }else if(!firstRoute){
        firstRoute = false;
        window.location.reload();
    }
    previousRoute = href;
}

function bindRoute(){
    "use strict";
    if(!initialRoutePopped) {
        (function () {
            // There's nothing to do for older browsers ;)
            if (!window.addEventListener) {
                return;
            }
            var blockPopstateEvent = document.readyState !== "complete";
            window.addEventListener("load", function () {
                // The timeout ensures that popstate-events will be unblocked right
                // after the load event occured, but not in the same event-loop cycle.
                setTimeout(function () {
                    blockPopstateEvent = false;
                }, 0);
            }, false);
            window.addEventListener("popstate", function (evt) {
                if (blockPopstateEvent && document.readyState === "complete") {
                    evt.preventDefault();
                    evt.stopImmediatePropagation();
                }
            }, false);
        })();
        // setTimeout(handleRoute);

        previousRoute = window.location.href;
    }
    initialRoutePopped = true;
    window.addEventListener("popstate", handleRoute);
}


function unbindRoute(){
    "use strict";
    window.removeEventListener("popstate", handleRoute);
}


function navigateRoute(url, options){
    "use strict";
    options = options || {};
    var history = window.history, func = options && options.replace ? "replaceState" : "pushState";
    history[func](null, options.title || "", url);
    if(!options.silent){
        handleRoute();
    }
}


function matchRoute(path){
    "use strict";
    var i, router, link, result;
    for(i=0; i< routerSet.length; i++){
        router = routerSet[i];
        result = router.match(path);
        if(result){
            return result;
        }
    }
    return false;
}

function link(){
    "use strict";
    var args = Array.prototype.slice.call(arguments), stack = args, item;
    if(args.length === 0){
        return links.slice(0);
    }
    if(args.length === 1 && utils.isString(args[0])){
        return find(args[0]);
    }
    while(stack.length){
        item = stack.pop();
        if(utils.isArray(item)){
            stack.push.apply(stack, item);
        }else{
            item = utils.assign({}, item);
            if(!item.pattern || !item.name){
                throw new Error("No pattern or name defined for the link");
            }
            item.match = pattern.parse(item.pattern, true);
            item.reverse = item.match.reverse;
            links.push(item);
        }
    }
}

function find(name){
    "use strict";
    var i;
    for(i=0; i<links.length; i++){
        if(links[i].name === name){
            return links[i];
        }
    }
}

function resolve(url){
    "use strict";
    var i, match;
    if(url.charAt(0) === '/'){
        url = url.substr(1);
    }
    for(i=0; i<links.length; i++){
        match = links[i].match(url);
        if(match){
            links[i].params = match;
            return links[i];
        }
    }
    return false;
}


function reverse(name, args){
    "use strict";
    var ln = find(name), path;
    if(ln){
        path = ln.reverse(args);
        if(path){
            return "/" + path;
        }
    }
    return false;
}


function Router(linkMap){
    "use strict";
    var routes = this.routes = [], i, name, ln, value;
    for(name in linkMap){
        if(linkMap.hasOwnProperty(name)){
            value = linkMap[name];
            ln = find(name);
            if(!ln){
                throw new Error("No related link found: " + name);
            }
            routes.push({link: ln, func: value});
        }
    }
}


Router.prototype.start = function (silent) {
  "use strict";
    routerSet.push(this);
    if(routerSet.length && !monitorRoutes){
        bindRoute();
        monitorRoutes = true;
    }
    if(!silent){
        var result = this.match(window.location.pathname);
        if(result){
            result.func(result.args);
        }
    }
}


Router.prototype.contains = function (name) {
  "use strict";
    var routes = this.routes, i, ln, route, match;
    for(i=0; i< routes.length; i++){
        route = routes[i];
        ln = route.link;
        if(ln.name === name){
            return true;
        }
    }
    return false;
}


Router.prototype.match = function (path) {
  "use strict";
    var routes = this.routes, i, ln, route, match;
    if(path.charAt(0) === '/'){
        path = path.substr(1);
    }
    for(i=0; i< routes.length; i++){
        route = routes[i];
        ln = route.link;
        match = ln.match(path);
        if(match){
            route.args = match;
            delete match.$lastIndex;
            return route;
        }
    }
    return false;
}


Router.prototype.stop = function () {
  "use strict";
    utils.remove(routerSet, this);
    if(!routerSet.length && monitorRoutes){
        unbindRoute();
        monitorRoutes = false;
    }
}


function mount(){
    "use strict";
    document.addEventListener('click', function(event){
        event = dom.normalizeEvent(event);
        var target = event.target;
        if(target.tagName === 'A' && target.href && !utils.isExternalUrl(target.href)){
            navigateRoute(target.pathname);
            event.preventDefault();
        }
    }, false);
}


function isRouted(name){
    "use strict";
    var i, router;
    for(i=0;i<routerSet.length;i++){
        router = routerSet[i];
        if(router.contains(name)){
            return true;
        }
    }
    return false;
}


u.component("struts-router", {
    routes: [

    ],
    __createHandler: function(self, value){
        "use strict";
        return function(params){
            self.set({component: value, params: params});
        };
    },
    initialize: function () {
        "use strict";
        var routes = {}, self = this, i, defined = this.routes, value;
        for(i=0; i<defined.length; i++){
            value = defined[i];
            routes[value] = this.__createHandler(this, value);
        }
        this.router = uru.router(routes);
        this.router.start();
    },
    onUnmount: function () {
        "use strict";
      this.router.stop();
    },
    onSwitch: function(ctx){
        "use strict";
    },
    render: function(ctx){
        "use strict";
        this.onSwitch(ctx);
        if(ctx.component){
            return uru(ctx.component, {params: ctx.params});
        }else{
            return this.notfound();
        }
    },
    notfound: function(){
        "use strict";
        return uru("h1", "Oops ! Not found !!!!");
    }
});


module.exports = {
    Router: Router,
    link: link,
    resolve: resolve,
    route: navigateRoute,
    reverse: reverse,
    mount: mount,
    isRouted: isRouted
};