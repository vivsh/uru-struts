
var $ = require("jquery"), u = require("uru");


function HttpError(){
    "use strict";
    this.statusCode = -1;
    this.url = "";
    this.message = "";
    this.data = "";
}


function HttpResponse(jqXHR, textStatus, result){
    "use strict";
    this.jqXHR = jqXHR;
    this.textStatus = textStatus;
    if(textStatus === 'success'){
        this.content = result;
    }else{
        this.error = result;
    }
}

function sendRequest(type, url, data){
    "use strict";
    var result = $.Deferred();
    return $.ajax({
        type: "GET",
        url: url,
        processData: false,
        contentType:  "application/json",
        dataType: "json",
        data: data ? JSON.stringify(data) : data
    }).always(function(){
        u.redraw();
    }).done(function(data, textStatus, jqXHR){
        result.resolve(new HttpResponse(jqXHR, textStatus, data));
    }).fail(function(jqXHR, textStatus, error){
        result.resolve(new HttpResponse(jqXHR, textStatus, error));
    });
    return result;
}




function get(url, data){
    "use strict";
    return sendRequest("GET", url, data);
}


function post(url, data){
    "use strict";
    return sendRequest("POST", url, data);
}


function put(url, data){
    "use strict";
    return sendRequest("PUT", url, data);
}


function destroy(url, data){
    "use strict";
    return sendRequest("DELETE", url, data);
}


function patch(url, data){
    "use strict";
    return sendRequest("DELETE", url, data);
}


function submitForm(formElement) {
    var url = formElement.action || "";
    var method = formElement.method || "GET";
    var formData = new FormData(formElement);
    return $.ajax({
        type: method,
        processData: false,
        contentType: false,
        data:formData
    });
}


module.exports = {
    get: get,
    post: post,
    put: put,
    patch: patch,
    destroy: destroy,
    submit: submitForm
};

