

var pattern = require("./pattern"), u = require("uru"), utils = u.utils, dom = u.dom;

var routerSet = [], monitorRoutes = false,
    initialRoutePopped = false,
    firstRoute = true,
    previousRoute;

var linkList = [];

function Link(name, expr, component) {
    this.name = name;
    this.expr = name;
    this.component;
}

Link.prototype = {
    constructor: Link,
    isPage: function(){
        return this.component != null;
    }
}

function normalizePathName(pathname){
    "use strict";
    if(pathname.charAt(0) !== '/'){
        pathname = "/" + pathname;
    }
    return pathname;
}

function handleRoute(event){
    "use strict";
    var pathname = normalizePathName(window.location.pathname), href = window.location.href, hash = location.hash;
    if(href === previousRoute){
        if(hash && (hash = document.getElementById(hash.substr(1)))){
            hash.scrollIntoView();
        }
        return;
    }
    var result = matchRoute(pathname);
    if(result){
        if(event) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }else{
            //pushState triggers no event. Hence, this call is needed
            u.redraw(true);
        }
        result.func(result.args);
    }else {
        window.location.reload();
    }
    firstRoute = false;
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
    window.addEventListener("popstate", function (event) {
        handleRoute(event);
        u.redraw();
    });
}


function unbindRoute(){
    "use strict";
    window.removeEventListener("popstate", handleRoute);
}


function navigateRoute(url, options){
    "use strict";
    options = options || {};
    var history = window.history, func = options && options.replace ? "replaceState" : "pushState";
    history[func]({uru: true}, options.title || "", url);
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


function findLink(name){
    "use strict";
    var i;
    for(i=0; i<linkList.length; i++){
        if(linkList[i].name === name){
            return linkList[i];
        }
    }
}


function resolve(url){
    "use strict";
    var i, match, result = {};
    // if(url.charAt(0) === '/'){
    //     url = url.substr(1);
    // }
    for(i=0; i<linkList.length; i++){
        match = linkList[i].match(url);
        if(match){
            result.params = match;
            result.component = linkList[i].component;
            result.name = linkList[i].name;
            linkList[i].params = match;
            return result;
        }
    }
    return false;
}


function reverse(name, args){
    "use strict";
    var ln = findLink(name), path;
    if(ln){
        path = ln.reverse(args);
        if(path){
            return path;
        }
    }
    return false;
}

function setLinkPattern(link, expr) {
    link.pattern = expr;
    link.match = pattern.parse(link.pattern, true);
    link.reverse = link.match.reverse;
    return link;
}

function Router(linkMap, root){
    "use strict";
    var routes = this.routes = [], i, name, ln, value;
    root = root || "";
    for(name in linkMap){
        if(linkMap.hasOwnProperty(name)){
            value = linkMap[name];
            ln = findLink(name);
            if(!ln){
                throw new Error("No link found with the name "+name);
            }
            setLinkPattern(ln, root + ln.pattern);
            if(!ln){
                throw new Error("No related link found: " + name);
            }
            routes.push({link: ln, func: value});
        }
    }
    u.redraw();//redraw is needed because links are changed
}


Router.prototype.start = function (silent) {
  "use strict";
    var i, route;
    for(i=0; i<this.routes.length; i++){
        route = this.routes[i];
        if(route.link.router){
            throw new Error("A link cannot be associated with more than one router");
        }
        route.link.router = this;
    }
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
    // if(path.charAt(0) === '/'){
    //     path = path.substr(1);
    // }
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
    var i, route;
    for(i=0; i<this.routes.length; i++){
        route = this.routes[i];
        delete route.link.router;
    }
    utils.remove(routerSet, this);
    if(!routerSet.length && monitorRoutes){
        unbindRoute();
        monitorRoutes = false;
    }
}

function isLocalUrl(target){
    var value = target.getAttribute("href") || "";
    return value.charAt(0) === '#';
}

function mount(){
    "use strict";
    document.addEventListener('click', function(event){
        event = dom.normalizeEvent(event);
        var target = event.target;
        while(target.parentNode && target.tagName !== 'A'){
            target = target.parentNode;
        }
        if(target.target){
            return;
        }
        if(target.tagName === 'A' && target.href && !isLocalUrl(target) && !utils.isExternalUrl(target.href)){
            event.preventDefault();
            navigateRoute(target.href);
            u.redraw();
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



function addLink(name, expr) {
    var component = u.component(name);
    var item = {name: name, pattern: expr, component: component};

    item.match = pattern.parse(item.pattern, true);
    
    item.reverse = item.match.reverse;

    linkList.push(item);
}


function currentPath() {
    "use strict";
    var path = window.location.pathname;
    if(path.charAt(0) != "/"){
        path = "/" + path ;
    }
    return path;
}


function links(predicate){
    "use strict";
    var result = [], i, page;
    for(i=0; i< linkList.length; i++){
        page = linkList[i];
        if(!page.component){
            continue;
        }
        if(!predicate || predicate(page.component)){
            result.push(page);
        }
    }
    return result;
}


module.exports = {
    Router: Router,
    addLink: addLink,
    resolve: resolve,
    route: navigateRoute,
    reverse: reverse,
    mount: mount,
    links: links,
    isRouted: isRouted,
    currentPath: currentPath
};