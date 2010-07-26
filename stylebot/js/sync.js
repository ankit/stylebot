/** Code for supporting sync across browsers **/

// called when syncing is turned on in options page
function sync() {
    loadStylebotBookmark(function(data) {
        if (data) {
            var styles = JSON.parse(data);
            if (styles != cache.styles)
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

function mergeStyles(styles) {
    saveStyles(styles);
}