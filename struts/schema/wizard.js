

u.component("wizard", {
    getStepNames: function(){
        "use strict";
        return [];
    },
    render: function (ctx) {
        var step = isValid();
        return u(ctx.step, ctx);
    }
});

