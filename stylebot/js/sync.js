/** Code for supporting sync across browsers **/

// called when syncing is turned on in options page
function sync() {
    loadStylebotBookmark(function(data) {
        if (data) {
            var styles = null;
            try {
                styles = JSON.parse(data);
            }
            catch(e) {
            }
            if (styles && styles != cache.styles)
                mergeStyles(styles);
        }
        else {
            saveStylebotBookmark(JSON.stringify(cache.styles));
        }
    });
}

// called when syncing is turned off
function stopSync() {
}

// TODO: actually do some merging here :)
function mergeStyles(styles) {
    saveStyles(styles);
}

// add listener to sync when bookmark is changed
chrome.bookmarks.onChanged.addListener(function(id, properties) {
    if (cache.options.sync && id == cache.bookmarkId && !saveBookmarkWasCalled)
        sync();
});