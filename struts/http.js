
var $ = require("jquery"), u = require("uru");


function HttpResponse(jqXHR, textStatus, result){
    "use strict";
    this.jqXHR = jqXHR;
    this.textStatus = textStatus;
    this.status = jqXHR.status;
    if(textStatus === 'success'){
        this.content = result;
    }else{
        this.error = result;
    }
}


HttpResponse.prototype.isSuccess = function () {
    return parseInt(this.jqXHR.status/100) == 2 ;
}


HttpResponse.prototype.isError = function () {
    return !this.isSuccess();
}


HttpResponse.prototype.json = function () {
    return this.jqXHR.responseJSON;
}


HttpResponse.prototype.text = function () {
    return this.jqXHR.responseText;
}


HttpResponse.handle = function (deferred) {
    var result = $.Deferred();
    deferred.done(function(data, textStatus, jqXHR){
        result.resolve(new HttpResponse(jqXHR, textStatus, data));
    }).fail(function(jqXHR, textStatus, error){
        result.reject(new HttpResponse(jqXHR, textStatus, error));
    }).always(function(){
        u.redraw();
    });
    return result;
}



function sendRequest(type, url, data){
    "use strict";
    var processData = false;

    if(data){
        if(type === 'GET'){
            data = data;
            processData = true;
        }else{
            data = JSON.stringify(data);
        }
    }

    return HttpResponse.handle($.ajax({
        type: type,
        url: url,
        processData: processData,
        contentType:  "application/json",
        dataType: "json",
        data: data
    }));
}


function getHtml(url, data){
    "use strict";
    return $.ajax({
        type: 'GET',
        url: url,
        data: data
    }).always(function(){
       u.redraw();
    });
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
    return sendRequest("PATCH", url, data);
}


function submitForm(formElement, url, method) {
    url = url || formElement.action || "";
    method = method || formElement.method || "GET";
    var formData = new FormData(formElement);
    return HttpResponse.handle($.ajax(url, {
        type: method,
        processData: false,
        contentType: false,
        data:formData
    }));
}


module.exports = {
    get: get,
    post: post,
    put: put,
    patch: patch,
    destroy: destroy,
    submit: submitForm,
    getHtml: getHtml
};

