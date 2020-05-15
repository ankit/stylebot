/**
 * Attaches the screenshot from the cache to the post style form.
 * Runs on http://stylebot.me/post
 */
setTimeout(function () {
  chrome.storage.local.get('screenshot_cache', function (items) {
    var SCREENSHOT_AVAILABLE_EVENT = 'stylebotScreenshotAvailable';
    var POST_FORM_SELECTOR = '.post_style_form';

    var screenshotDataURL = items['screenshot_cache'];

    if (screenshotDataURL) {
      var $form = $(POST_FORM_SELECTOR);
      $form.attr('data-screenshot', screenshotDataURL);

      var customEvent = document.createEvent('Event');
      customEvent.initEvent(SCREENSHOT_AVAILABLE_EVENT, true, true);
      $form.get(0).dispatchEvent(customEvent);

      // Reset cache.
      chrome.storage.local.remove('screenshot_cache');
    }
  });
}, 500);
