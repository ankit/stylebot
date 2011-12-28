/**
* stylebot.chrome
*
* Methods sending / receving messages from background.html
**/

stylebot.chrome = {
  /**
    * Send the appropriate request to the background page
    *   to update the page actio
    * @param {boolean} Stylebot editor status i.e. open or closed
    */
  setPageAction: function(status) {
    if (status)
      chrome.extension.sendRequest({ name: 'enablePageAction' }, function() {});
    else if (!$.isEmptyObject(stylebot.style.rules) || !$.isEmptyObject(stylebot.style.global))
      chrome.extension.sendRequest({ name: 'highlightPageAction' }, function() {});
    else
      chrome.extension.sendRequest({ name: 'disablePageAction' }, function() {});
  },

  /**
    * Send a request to the background page to copy text to clipboard
    * @param {string} text Text to copy
    */
  copyToClipboard: function(text) {
    chrome.extension.sendRequest({ name: 'copyToClipboard', text: text }, function() {});
  },

  /**
    * Send a request to background page to save the rules for a URL
    * @param {string} url URL for which to save rules
    * @param {object} rules The style rules
    * @param {data} Any additional data to send as 'data' property
    */
  save: function(url, rules, data) {
    chrome.extension.sendRequest({ name: 'save', rules: rules, url: url, data: data }, function() {});
  },

  /**
    * Send a request to background page to check if a style exists for a URL
    * @param {string} url URL for which to check
    * @param {function} callback Method called with the response from background page
    */
  doesStyleExist: function(url, callback) {
    chrome.extension.sendRequest({ name: 'doesStyleExist', url: url }, callback);
  },

  /**
    * Send the installation request for a style from Stylebot Social
    *   to background page
    * @param {string} url URL for which to install new styles
    * @param {object} rules The styles
    * @param {number} id ID of the style on Stylebot Social
    */
  install: function(url, rules, id) {
    chrome.extension.sendRequest({ name: 'install', rules: rules, url: url, id: id }, function() {});
  },

  /**
    * Transfer all rules from a source URL to a destination URL
    * @param {string} src Source URL
    * @param {string} dest Destination URL
    */
  transfer: function(src, dest) {
    chrome.extension.sendRequest({name: 'transfer', source: src, destination: dest }, function() {});
  },

  /**
    * Send request to fetch options from background page datastore
    */
  fetchOptions: function() {
    chrome.extension.sendRequest({ name: 'fetchOptions' }, function(response) {
      initialize(response);
    });
  },

  /**
    * Send request to save accordion state
    * @param {array} enabledAccordions Indices of open accordions
    */
  saveAccordionState: function(enabledAccordions) {
    chrome.extension.sendRequest({ name: 'saveAccordionState', enabledAccordions: enabledAccordions }, function() {});
  },

  /**
    * Send request to background page to save an option
    * @param {string} name Option name
    * @param {object} value Option value
    */
  savePreference: function(name, value) {
    chrome.extension.sendRequest({ name: 'savePreference', preference: { name: name, value: value } }, function() {});
  },

  /**
    * Send request to background page to get an option's value
    * @param {string} name Option name
    * @param {function} callback Method to be called with the option value
    */
  getPreference: function(name, callback) {
    chrome.extension.sendRequest({ name: 'getPreference', preferenceName: name }, function(response) {
      callback(response.value);
    });
  },

  /**
    * Send request to background page to push styles
    *   i.e. save them to bookmark for sync
    */
  pushStyles: function() {
    chrome.extension.sendRequest({ name: 'pushStyles' }, function() {});
  },

  /**
    * Open the options page for stylebot
    */
  openOptionsPage: function() {
    window.open(chrome.extension.getURL('options.html'));
  }
};

/**
  * Add listeners for requests sent from options / background page
  */
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.name === 'status') {
      if (window != window.top)
        return;
      sendResponse({
        status: stylebot.status,
        rules: $.isEmptyObject(stylebot.style.rules) ? null : stylebot.style.rules,
        global: $.isEmptyObject(stylebot.style.global) ? null : stylebot.style.global
      });
    }

    else if (request.name === 'toggle') {
      if (window.document.domain === 'mail.google.com') {
        if (!window.frameElement || window.frameElement.id != 'canvas_frame')
          return;
      }
      else if (window != window.top)
        return;
      stylebot.toggle();
      sendResponse({ status: stylebot.status });
    }

    else if (request.name === 'setOptions') {
      stylebot.setOptions(request.options);
      sendResponse({});
    }

    else if (request.name === 'openWidget') {
      stylebot.contextmenu.openWidget();
      sendResponse({});
    }

    else if (request.name === 'searchSocial') {
      if (!window.top)
        return;
      stylebot.contextmenu.searchSocial();
    }

    else if (request.name === 'shareStyleOnSocial') {
      if (!window.top)
        return;
      stylebot.contextmenu.shareStyleOnSocial();
    }

    else if (request.name === 'toggleStyle') {
      if (!window.top)
        return;
      stylebot.style.toggle();
      sendResponse({ status: stylebot.style.status });
    }

    else if (request.name === 'styleStatus') {
      if (!window.top)
        return;
      sendResponse({ status: stylebot.style.status });
    }
  }
);