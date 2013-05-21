// Version updates
// This is the only place you need to update the version string
// besides manifest.json.
var VERSION = '1.7.3.4';

/**
  * Updates the version of extension.
  * Updates the data model if required.
  */
function updateVersion(callback) {
  chrome.storage.local.get(['version'], function(storage) {
    if (storage['version'] != VERSION) {
      console.log('Updating to version ' + VERSION);
      chrome.storage.local.set({'version': VERSION});
    }

    callback();
  });
}

/**
  * Show notification for version update
  */
function showUpdateNotification() {
  var notification = webkitNotifications.createHTMLNotification(
    'notification.html'
  );
  notification.show();
}
