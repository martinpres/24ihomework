'use strict';

// variaous messages
var E_GAPI_CALL_NON200 = 'Google API call ended with HTTP status %s %s.';
var E_GAPI_CALL_NON200_REASON = 'Google API call ended with HTTP status %s %s. Reason: %s';
var E_XMLHTTP_EROR = 'HTTP call failed.';
var E_OBJ_HTTP = 'Can not instantiate HTTP api.';
var E_OK = '';

function CustomQuery (apiKey, cx) {

    // key and context is provided by google
    this.apiKey = apiKey;
    this.cx = cx;

    // base api call settings
    this.prettyPrint = false;
    this.method = 'GET';
    this.baseurl = 'https://www.googleapis.com/customsearch/';
    this.version = 'v1';
    this.query = '';
    this.webResultFields = 'searchInformation(totalResults),items(displayLink,snippet,title,link)';
    this.imageResultFields = 'searchInformation(totalResults),items(title,link,image/thumbnailLink)';
    this.image = '&searchType=image';
    
    // final url to call
    this.callurl='';

    // response from api call
    this.result={};

    this.BuildCallUrl();
}


/**
 * Prepares base call url.
 * @return int
 */
CustomQuery.prototype.BuildCallUrl = function() {
    this.callurl = this.baseurl + this.version + '?key=' + this.apiKey + '&cx=' + this.cx;
    this.callurl += '&prettyPrint=' + this.prettyPrint.toString();
    return 0;
};


/**
 * Sends a web search request to the google custom search api. Response is passed to callback.
 * @param query A search query.
 * @param callback A callback function which receives the result of a search api call.
 * @param start A start index of first result (google api enforces max 100 results per query).
 * @param resultCnt Maximum number of returned results (google api enforces max 10 results per call)
 * @return int
 */
CustomQuery.prototype.QueryWeb = function(query, callback, start, resultCnt) {
    return this.SearchApiRequest(query, callback, start, this.webResultFields, false, resultCnt);
};


/**
 * Sends an image search request to the google custom search api. Response is passed to callback.
 * @param query A search query.
 * @param callback A callback function which receives the result of a search api call.
 * @param start A start index of first result (google api enforces max 100 results per query).
 * @param resultCnt Maximum number of returned results (google api enforces max 10 results per call)
 * @return int
 */
CustomQuery.prototype.QueryImg = function(query, callback, start, resultCnt) {
    return this.SearchApiRequest(query, callback, start, this.imageResultFields, true, resultCnt);
};


/**
 * Sends a HTTP request to the google custom search api. Response is passed to callback.
 * Any error is also passed to the callback function.
 * @param query A search query.
 * @param callback A callback function which receives the result of a search api call.
 * @param start A start index of first result (google api enforces max 100 results per query).
 * @param fields A limitation of fields that are returned from the google api.
 * @param imageSearch A flag telling that this request is image search.
 * @param resultCnt Maximum number of returned results (google api enforces max 10 results per call)
 * @return int
 */
CustomQuery.prototype.SearchApiRequest = function(query, callback, start, fields, imageSearch, resultCnt) {
    if (query === undefined) query = '';
    if (callback === undefined) return 0;
    if (start === undefined) start = 1;
    if (imageSearch === undefined) imageSearch = false;
    if (fields === undefined) fields = '';
    if (resultCnt === undefined) resultCnt = 10;

    var self = this;
    self.result = {};
    self.query = query;

    var fullurl = self.callurl + '&q=' + encodeURI(self.query) + '&start=' + start + '&fields=' + fields + '&num=' + resultCnt;
    if (imageSearch === true) fullurl += self.image;

    var errObj = {err: false, errmsg: E_OK};

    var xhttp = null;
    if (window.XMLHttpRequest) {        // firefox & gang 
        xhttp = new XMLHttpRequest();
    } /*else if (window.ActiveXObject) {  // ie (uncomment if ie is supported)
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }*/

    if (xhttp === null) {
        errObj = self.GetError(E_OBJ_HTTP);
        callback(self.result, start, errObj);
        return 0;
    }
    
    xhttp.onerror = function() {
        var errObj = self.GetError(E_XMLHTTP_EROR);
        callback(self.result, errObj);
    }

    xhttp.onreadystatechange = function() {
        var errObj = {err: false, errmsg: E_OK};
        var errmsg = E_OK, params = [];

        if (xhttp.readyState === XMLHttpRequest.DONE) {
    
            if (xhttp.status !== 200) {
                // NOT 200 OK
                errmsg = E_GAPI_CALL_NON200;
                params = [xhttp.status, xhttp.statusText];
                
                if (xhttp.responseText !== undefined && xhttp.responseText !== '') {
                    var erresp = JSON.parse(xhttp.responseText)
                    if (erresp.error !== undefined && erresp.error.message !== undefined) {
                        params.push(erresp.error.message);
                        errmsg = E_GAPI_CALL_NON200_REASON;
                    }
                }
    
                errObj = self.GetError(errmsg, params);
                
            } else {
                // 200 OK
                self.result = JSON.parse(xhttp.responseText);
            }

            callback(self.result, start, errObj);
        }
    }

    xhttp.open(self.method, fullurl, true);
    xhttp.send(null);

    return 0;
};


/**
 * Get web results from given index.
 * This function uses previously assigned query to ensure that it is moving within
 * original result set.
 * @param start A start index of first item in result set.
 * @param callback A callback function which will receive the result set.
 * @return int
 */
CustomQuery.prototype.GetWebResultsFromIndex = function(start, resultCnt, callback) {
    return this.SearchApiRequest(this.query, callback, start, this.webResultFields, false, resultCnt);
};


/**
 * Get image results from given index.
 * This function uses previously assigned query to ensure that it is moving within
 * original result set.
 * @param start A start index of first item in result set.
 * @param callback A callback function which will receive the result set.
 * @return int
 */
CustomQuery.prototype.GetImageResultsFromIndex = function(start,callback) {
    return this.SearchApiRequest(this.query, callback, start, this.webResultFields, true);
};


/**
 * Creates an error object based on error message. Message can be parametrized with %s.
 * Values for message are passed in the second argument.
 * @param msg A parametrized error message.
 * @param parameters An array of values which are passed to the msg argument.
 * @return object
 */
CustomQuery.prototype.GetError = function(msg, parameters) {
    if (parameters === undefined) parameters = [];
    return {
        err: true,
        errmsg: this.printf(msg, parameters)
    };
};


/**
 * Fill parameters to the parametrized string and returns it.
 * @param str A parametrized string. Accepted parameter is %s (string).
 * @param argArr An array of values which are passed to the first argument and replaces every occurrence of the %s.
 * @return string
 */
CustomQuery.prototype.printf = function(str, argArr) {
    var reducer = function(acum, currVal) {
        return acum.replace(/%s/, currVal);
    }

    return argArr.reduce(reducer, str);
};
