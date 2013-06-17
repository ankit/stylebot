// Version updates
// This is the only place you need to update the version string
// besides manifest.json.
var VERSION = '2';

/**
 * Updates the version of extension.
 * Updates the data model if required.
 */
function updateVersion(callback) {
  chrome.storage.local.get(['version'], function(storage) {
    if (storage['version'] != VERSION) {
      chrome.storage.local.set({'version': VERSION});
      showUpdateNotification();
    }

    callback();
  });
}

/**
 * Show notification for version update
 */
function showUpdateNotification() {
  var notification = webkitNotifications.createHTMLNotification(
    'notification/index.html'
  );
  notification.show();
}

