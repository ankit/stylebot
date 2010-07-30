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

// to prevent sync() from getting called when saveSyncData() changes bookmark url
var saveSyncDataWasCalled = false;

// extension name. used to create titles for bookmark / containing folder
var syncName = "stylebot";
var syncBookmarkName = syncName + "_data";
var syncURL = "http://" + syncName + "/?data=";
var onSync = saveStylesLocally;
// data source is cache.styles here

// loads data from bookmark (if it exists). If no data is returned, saves local data in the bookmark
function sync() {
    loadSyncData(function(data) {
        if (data && data != cache.styles) {
            onSync(data);
        }
        else {
            saveSyncData(cache.styles);
        }
    });
}

// called when syncing is turned off
function stopSync() {
}

// loads data from bookmark and handles duplicate bookmarks.
function loadSyncData(callback) {
    var parse = function(url) {
        if (url && url != "") {
            var jsonString = unescape(url.replace(syncURL, ""));
            try {
                callback(JSON.parse(jsonString));
            }
            catch(e) {
                callback(null)
            }
        }
        else
            callback(null);
    }

    loadBookmark(null, syncBookmarkName, function(bookmarks) {
        if (bookmarks.length != 0) {
            var bookmark = bookmarks[0];
            // handle duplicates
            if (bookmarks.length > 0) {
                // retain only the latest bookmark. get rid of all others
                // TODO: call mergeStyles for earlier bookmarks
                var len = bookmarks.length;
                for (var i = 1; i < len; i++) {
                    if (bookmarks[i].dateAdded < bookmark.dateAdded) {
                        removeBookmarkTree(bookmark.parentId);
                        bookmark = bookmarks[i];
                    }
                    else
                        removeBookmarkTree(bookmarks[i].parentId);
                }
            }
            syncId = bookmark.id;
            parse(bookmark.url);
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
    if (typeof data != "string") {
        try {
            data = JSON.stringify(data);
        }
        catch(e) {
            return false;
        }
    }
    var url = syncURL + escape(data);
    if (!syncId) {
        var create = function(id) {
            createBookmark(syncBookmarkName, url, id, function(bookmark) {
                syncId = bookmark.id;
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
                saveSyncData(cache.styles);
            }
        });
    }
}

// add listener to sync when bookmark is changed
chrome.bookmarks.onChanged.addListener(function(id, properties) {
    if (cache.options.sync && id == syncId && !saveSyncDataWasCalled)
        sync();
});