
var routes = require("./routes"), u = require("uru");



function createHandler(self, value){
    "use strict";
    return function(params){
        self.set({component: value, params: params});
    };
}


var Router = u.Component.extend({
    root: "",
    routes: [

    ],
    initialize: function () {
        "use strict";
        var pages = {}, self = this, i, defined = this.routes, value;
        for(i=0; i<defined.length; i++){
            value = defined[i];
            pages[value] = createHandler(this, value);
        }
        this.router = new routes.Router(pages, this.root);
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
            return u(ctx.component,
                {params: ctx.params, request: null, session: null, cache: null}
            );
        }else{
            return this.notfound();
        }
    },
    notfound: function(){
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

});


function page(name, obj){
    "use strict";
    var base;

    if(obj.pattern === null || obj.pattern === undefined){
        console.log(obj);
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
    pages: routes.links
}