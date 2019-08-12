'use strict';

// provided by google
var API_KEY = 'AIzaSyBSYXQZ8TtlPD5BjPqacbXWsfaBu2SoZjY';
var API_CX = '017040271195194510670:csfaunyoaoe';

// custom constants
var PG_WEB_ITEMS_PER_PAGE = 4;      
var PG_IMG_ITEMS_PER_PAGE = 10;     // 10 is default and also maximum count of items per page by google
var PG_MAX_PAGE = 25;               // 100 is the maximum amount of results for this custom search

// custom query search object
var cq = new CustomQuery(API_KEY, API_CX);

// last error
var lastError = '';

var defaultSearchButtonValue = 'Search';

// set proper event handlers
window.onload = setEventHandlers;


/**
 * Sets event handlers to proper elements.
 */
function setEventHandlers() {
    document.getElementById('searchQuerySubmit').addEventListener("click", searchButtonClicked);
    document.getElementById("searchQueryInput").addEventListener("keydown", enterPressed);
}


/**
 * Search query button click function.
 */ 
function searchButtonClicked() {
    setSearchButtonText('Searching');
    getResults(document.getElementById("searchQueryInput").value, 1);
}


/**
 * Search query button keyboard press function.
 */
function enterPressed(e) {
    if (!e) e = window.event;
        
    //e.preventDefault();

    // enter is pressed
    if (e.keyCode == 13) {
        getResults(this.value, 1);
    }
}


/**
 * Performs apii calls for image and web results.
 */
function getResults(searchQueryInput, startIndex) {

    if (searchQueryInput === "" || searchQueryInput === undefined) {
        setSearchButtonText(defaultSearchButtonValue);
        return;
    }

    cq.QueryWeb(searchQueryInput, displayWebResults, startIndex, PG_WEB_ITEMS_PER_PAGE);
    cq.QueryImg(searchQueryInput, displayImgResults, startIndex, PG_IMG_ITEMS_PER_PAGE);

    return;
}


/**
 * Performs apii calls for web results from set start index. this function is
 * used by paginator. 
 */
function getWebResultPage(pageNo) {
    if (pageNo === undefined || pageNo < 1) pageNo = 1;
    var startIndex = ((pageNo - 1) * PG_WEB_ITEMS_PER_PAGE) + 1;
    cq.GetWebResultsFromIndex(startIndex, PG_WEB_ITEMS_PER_PAGE, displayWebResults);
}


/**
 * Displays web results.
 * @param result A result from api call containing web results.
 * @param startIndex An integer containing start index of web results
 * (used by paginator).
 * @param errObj An error object containing information about error.
 */
function displayWebResults(result, startIndex, errObj) {  
    if(errObj === undefined) return;
    if (!errObj.err) {
        if (!resultIsOk(result)) return;

        var itemsCnt = result.items.length;
        var totalResults = result.searchInformation.totalResults;

        if (itemsCnt === undefined) itemsCnt = 0;
        if (totalResults === undefined) totalResults = 0;

        var containerDiv = document.getElementById('web');
        containerDiv.innerHTML = '';

        for (var i = 0; i < itemsCnt; i++) {
            containerDiv.appendChild(
                newWebResult(
                    result.items[i].title,
                    result.items[i].link,
                    result.items[i].snippet
                )
            );
        }

        displayPaginator(
            'webPaginator', 
            Math.ceil(startIndex / PG_WEB_ITEMS_PER_PAGE), 
            PG_WEB_ITEMS_PER_PAGE,
            totalResults,
            function() {
                getWebResultPage(this.innerText);
            }
        );

    } else {
        displayError(errObj.errmsg);
    }
}


/**
 * Displays image results.
 * @param result A result from api call containing image results.
 * @param startIndex An integer containing start index of web results
 * (currently unused, possible usage with paginator).
 * @param errObj An error object containing information about error.
 */
function displayImgResults(result, startIndex, errObj) {
    setSearchButtonText(defaultSearchButtonValue);
    if(errObj === undefined) return;           
    if (!errObj.err) {
        if (!resultIsOk(result)) return;

        var itemsCnt = result.items.length;
        if (itemsCnt === undefined) itemsCnt = 0;
    
        var containerDiv = document.getElementById('images');
        containerDiv.innerHTML = '';

        for (var i = 0; i < itemsCnt; i++) {
            containerDiv.appendChild(
                newImage(
                    result.items[i].title,
                    result.items[i].image.thumbnailLink,
                    result.items[i].link
                )
            );
        }

    } else {
        displayError(errObj.errmsg);
    }
}


/**
 * Displays an error message
 * @param msg An error message.
 */
function displayError(msg) {
    if (msg !== lastError) {
        console.log(msg);  
        alert(msg);
        lastError = msg;
    }
}


/**
 * Dislays paginator.
 * @param divId An ID of div which should contain the paginator.
 * @param currentPage Current active page of the paginator.
 * @param itemsPerPage Amount of items per page. Used for internal calculation.
 * @param resultCount Total amount of results for pagination.
 * @param callback Callback processing onclick event of paginator items.
 */
function displayPaginator(divId, currentPage, itemsPerPage, resultCount, callback) {
    var paginatorDiv = document.getElementById(divId);
    var startPage = 1
    var endPage = Math.ceil(resultCount / itemsPerPage);

    if (endPage > PG_MAX_PAGE) endPage = PG_MAX_PAGE;

    paginatorDiv.innerHTML = '';

    for (var i = startPage; i <= endPage; i++) {
        var newSpan = document.createElement('span');

        newSpan.id = divId + '' + i;
        newSpan.className = 'paginatorItem';
        newSpan.innerText = i;
        newSpan.onclick = callback

        paginatorDiv.appendChild(newSpan);
    }

    var pgntItem = document.getElementById(divId + '' + currentPage);
    if (pgntItem !== undefined) pgntItem.className += ' activePage';
} 


/**
 * Creates a web result item.
 * @param title A title of the result.
 * @param link A link to web page of the result.
 * @param snippet A short snippet of the web result.
 * @return DOM element object
 */
function newWebResult(title, link, snippet) {
    var newDiv = document.createElement('div');
    newDiv.className = 'webResult';

    var newTitle = document.createElement('span');
    newTitle.className = 'wrTitle wrItem';
    newTitle.innerHTML = title;
    newDiv.appendChild(newTitle);

    var newLink = document.createElement('a');
    newLink.className = 'wrLink wrItem';
    newLink.href = link;
    newLink.innerText = link;
    newLink.target = '_blank';
    newDiv.appendChild(newLink);

    var newSnippet = document.createElement('span');
    newSnippet.className = 'wrSnippet wrItem';
    newSnippet.innerHTML = snippet;
    newDiv.appendChild(newSnippet);

    return newDiv;
}


/**
 * Creates a image result item.
 * @param title A title of the result.
 * @param thumbnaillink A link to the result image thumbnail.
 * @param link A link to the full image.
 * @return DOM element object
 */
function newImage(title, thumbnaillink, link) {
    var newA = document.createElement('a');
    var newImg = document.createElement('img');

    newA.className = 'imageLink';
    newA.href = link;
    newA.target = '_blank';

    newImg.className = 'imgResult';
    newImg.src = thumbnaillink;
    newImg.alt = title;
    newImg.title = title;

    newA.appendChild(newImg);

    return newA;
}


/**
 * Checks if the result object contains all required fields for this view.
 * @param result Google api call result object.
 * @return boolean
 */
function resultIsOk(result) {
    if (
        result === undefined || 
        //result.queries === undefined || 
        result.items === undefined ||
        result.searchInformation === undefined
    ) return false;
    
    return true;
}


/**
 * Sets text of the search button.
 * @param btnText A text to be displayed inside the search button.
 */
function setSearchButtonText(btnText) {
    if (btnText !== undefined && btnText !== '') {
        document.getElementById('searchQuerySubmit').innerText = btnText;
    }
}