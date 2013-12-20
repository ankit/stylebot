/**
 * Version updates
 * This is the only place you need to update the version string
 * besides manifest.json.
 *
 * Only update the version string here if you want to show a
 * notification.
 */
var VERSION = '2';

/**
 * Show notification for version update
 */
function showUpdateNotification() {
  try {
    var notification = webkitNotifications.createHTMLNotification(
      'notification/index.html'
    );
    notification.show();
  } catch(e) {
    console.log(e);
  }
}

/**
 * Updates the version of extension stored in storage
 * and data model if required.
 */
function updateVersion(callback) {
  chrome.storage.local.get(['version'], function(storage) {
    if (storage['version'] !== VERSION) {
      chrome.storage.local.set({'version': VERSION});
      showUpdateNotification();
    }

    callback();
  });
}