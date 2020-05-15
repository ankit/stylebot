/**
 * Manage sharing of styles to stylebot.me
 */
var PostToSocial = {
  /**
   * Cache a screenshot of the current tab and send a
   * request to the specified tab to share its styles on stylebot.me
   */
  init: function (tab) {
    chrome.windows.getCurrent(null, function (aWindow) {
      chrome.tabs.captureVisibleTab(aWindow.id, { format: 'png' }, function (
        dataURL
      ) {
        chrome.storage.local.set({ screenshot_cache: dataURL }, function () {
          chrome.tabs.sendRequest(
            tab.id,
            {
              name: 'postToSocial',
            },
            function (response) {}
          );
        });
      });
    });
  },

  /**
   * Open http://stylebot.me/post with pre-filled fields
   */
  post: function () {
    if (stylebot.style.rules) {
      CSSUtils.crunchFormattedCSS(stylebot.style.rules, false, false, function (
        css
      ) {
        var form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', 'http://stylebot.me/post');
        form.setAttribute('target', 'stylebot_social');

        var params = {
          site: stylebot.style.cache.url,
          css: css,
        };

        for (var key in params) {
          var hiddenField = document.createElement('input');
          hiddenField.setAttribute('type', 'hidden');
          hiddenField.setAttribute('name', key);
          hiddenField.setAttribute('value', params[key]);
          form.appendChild(hiddenField);
        }

        document.body.appendChild(form);
        window.open('submit.html', 'stylebot_social');
        form.submit();
        form.remove();
      });
    }
  },
};
