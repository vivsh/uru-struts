

var u = require("uru");

u.component("proxy", {
   onMount: function(){
       "use strict";
        this.refEl = document.getElementById(this.context.ref);
        this.refEl.style.display = 'none';
   },
    onUnmount: function(){
        "use strict";
        this.refEl.style.display = '';
    },
    hasChanged: function () {
        return false;
    },
    render: function () {
        return ;
    }
});

var BlockLoaderMixin = {
    this.$blockLoadCount:0,
    isLoading: function(){
        "use strict";
        return this.$blockLoadCount > 1
    },
    load: function(deferred){
        "use strict";
        var self;
        ++this.$blockLoadCount;
        deferred.always(function(){
            --self.$blockLoadCount;
        });
    },
    render: function(){
        "use strict";
        if(this.isLoading()){
            return this.renderLoader();
        }else{
            return this.renderContent();
        }
    },
    renderContent: function(){
        "use strict";

    },
    renderLoader: function(){
        "use strict";
        return u("div.u-loader.u-loader-block",
            u("i.fa.fa-spinner"), "Please wait ..."
        );
    }
}