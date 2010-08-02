/** 
 * Sync for chrome extensions
 * 
 * dependencies: bookmark.js
 *
 * Copyright (c) 2010 Ankit Ahuja
 * Dual licensed under GPL and MIT licenses.
 **/

// bookmark's id in which data is stored
var syncId;
var syncFolderId;

// to prevent sync() from getting called when saveSyncData() changes bookmark url
var saveSyncDataWasCalled = false;

// extension name. used to create titles for bookmark / containing folder
var syncName = "stylebot";
var syncBookmarkName = syncName + "_data";
var syncURL = "http://" + syncName + "/?data=";
var onSync = saveStylesLocally;
var onMerge = mergeStyles;
// data source is cache.styles here
// cache.options.sync is used to check if sync is enabled / disabled

// loads data from bookmark (if it exists). If no data is returned, saves local data in the bookmark
function sync() {
    loadSyncData(function(data) {
        if (data) {
            if (data != cache.styles)
                onSync(data);
        }
        else {
            saveSyncData(cache.styles);
        }
    });
}

// called when syncing is turned on in options page
// the only difference between this and sync() is that it merges local data with data from bookmark
function syncWithMerge() {
    loadSyncData(function(data) {
        if (data) {
            if (onMerge && data != cache.styles) {
                data = onMerge(data, cache.styles);
                saveSyncData(data);
            }
            onSync(data);
        }
        else {
            saveSyncData(cache.styles);
        }
    });
}

// called when syncing is turned on in options page and if sync is enabled, when background.html loads
function enableSync(merge) {
    attachSyncListeners();
    if (merge)
        syncWithMerge();
    else
        sync();
}

// called when syncing is turned off in options page
function disableSync() {
    detachSyncListeners();
}

// loads data from bookmark and handles duplicate bookmarks.
function loadSyncData(callback) {
    var parse = function(url) {
        var data = getDataFromURL(url);
        callback(data);
    }

    loadBookmark(null, syncBookmarkName, function(bookmarks) {
        if (bookmarks.length != 0) {
            var bookmark = bookmarks[0];
            var url = bookmark.url;
            syncId = bookmark.id;
            syncFolderId = bookmark.parentId;
            // handle duplicates
            if (bookmarks.length > 1) {
                // iterate through all the surplus bookmarks and merge data from them
                var len = bookmarks.length;
                for (var i = 1; i < len; i++) {
                    
                    if (onMerge && url != bookmarks[i].url)
                        url = getURLFromData(onMerge(getDataFromURL(bookmarks[i].url), getDataFromURL(url)));
                        
                    if (bookmarks[i].parentId != bookmark.parentId)
                        removeBookmarkTree(bookmarks[i].parentId);
                    else
                        removeBookmark(bookmarks[i].id);
                }
                saveSyncDataWasCalled = true;
                saveBookmark(syncId, url, function(){
                    saveSyncDataWasCalled = false;
                });
            }
            parse(url);
        }
        else
            parse(null);
    });
}

// saves data to the bookmark used for sync
// takes json object / string as input
function saveSyncData(data) {
    if (!data)
        return false;
    var url = getURLFromData(data);
    if (!syncId) {
        var create = function(id) {
            createBookmark(syncBookmarkName, url, id, function(bookmark) {
                syncId = bookmark.id;
                syncFolderId = bookmark.parentId;
            });
        }
        // create folder to contain the bookmark
        createBookmark(syncName + "Sync", null, null, function(folder) {
            create(folder.id);
        });
    }
    else {
        saveSyncDataWasCalled = true;
        saveBookmark(syncId, url, function(bookmark){
            saveSyncDataWasCalled = false;
            // some develish power deleted the bookmark. reset syncId and create a new bookmark
            if (!bookmark) {
                syncId = null;
                syncFolderId = null;
                saveSyncData(cache.styles);
            }
        });
    }
}

function loadSyncId() {
     loadBookmark(null, syncBookmarkName, function(bookmarks) {
         if (bookmarks.length != 0)
            syncId = bookmarks[0].id;
     });
}

// returns json object from url of the form http://syncName?data={...}
function getDataFromURL(url) {
    if (!url || url == "")
        return null;
    var jsonString = unescape(url.replace(syncURL, ""));
    try {
        return JSON.parse(jsonString);
    }
    catch(e) {
        return null;
    }
}

// returns url of the form http://syncName?data={...}
// takes json string or object as input
function getURLFromData(data) {
    if (typeof data != "string") {
        try {
            data = JSON.stringify(data);
        }
        catch(e) {
            return null;
        }
    }
    return syncURL + escape(data);
}

function attachSyncListeners() {
    // add listener to sync when bookmark is changed
    chrome.bookmarks.onChanged.addListener(onBookmarkUpdate);

    // add listener to sync when bookmark is removed
    // this handles the situation when Bookmark Sync is enabled on another machine
    chrome.bookmarks.onRemoved.addListener(onBookmarkUpdate);

    // add listener to sync when a bookmark is created in the sync folder
    // this handles duplicate bookmarks when Bookmark Sync is enabled
    chrome.bookmarks.onCreated.addListener(onBookmarkCreate);
}

function detachSyncListeners() {
    chrome.bookmarks.onChanged.removeListener(onBookmarkUpdate);
    chrome.bookmarks.onRemoved.removeListener(onBookmarkUpdate);
    chrome.bookmarks.onCreated.removeListener(onBookmarkCreate);
}

function onBookmarkUpdate(id, properties) {
    if (cache.options.sync && id == syncId && !saveSyncDataWasCalled) {
        sync();
    }
}

function onBookmarkCreate(id, bookmark) {
    if (cache.options.sync && bookmark.parentId == syncFolderId && !saveSyncDataWasCalled) {
        sync();
    }
}