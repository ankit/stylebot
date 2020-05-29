/* eslint-disable no-undef */
/**
 * Send / receive messages to/from elsewhere
 */
stylebot.chrome = {
  /**
   * Send the appropriate request to the background page
   *   to update the browser action
   * @param {boolean} Stylebot editor status i.e. open or closed
   */
  setBrowserAction: function(status) {
    if (status) {
      chrome.extension.sendRequest({
        name: 'activateBrowserAction',
      });
    } else if (
      !$.isEmptyObject(stylebot.style.rules) ||
      !$.isEmptyObject(stylebot.style.global)
    ) {
      chrome.extension.sendRequest({
        name: 'highlightBrowserAction',
      });
    } else {
      chrome.extension.sendRequest({
        name: 'unhighlightBrowserAction',
      });
    }
  },

  /**
   * Send a request to the background page to copy text to clipboard
   * @param {string} text Text to copy
   */
  copyToClipboard: function(text) {
    chrome.extension.sendRequest({
      name: 'copyToClipboard',
      text: text,
    });
  },

  /**
   * Send a request to background page to save the rules for a URL
   * @param {string} url URL for which to save rules
   * @param {object} rules The style rules
   * @param {data} Any additional data to send as 'data' property
   */
  save: function(url, rules, data) {
    chrome.extension.sendRequest({
      name: 'save',
      rules: rules,
      url: url,
      data: data,
    });
  },

  /**
   * Send a request to background page to check if a style exists for a URL
   * @param {string} url URL for which to check
   * @param {function} callback Method called with the response from background page
   */
  doesStyleExist: function(url, callback) {
    chrome.extension.sendRequest(
      {
        name: 'doesStyleExist',
        url: url,
      },
      callback
    );
  },

  /**
   * Transfer all rules from a source URL to a destination URL
   * @param {string} src Source URL
   * @param {string} dest Destination URL
   */
  transfer: function(src, dest) {
    chrome.extension.sendRequest({
      name: 'transfer',
      source: src,
      destination: dest,
    });
  },

  /**
   * Send request to fetch options from background page datastore
   */
  fetchOptions: function() {
    chrome.extension.sendRequest(
      {
        name: 'fetchOptions',
      },
      function(response) {
        initialize(response);
      }
    );
  },

  /**
   * Send request to save accordion state
   * @param {array} accordions Indices of open accordions
   */
  saveAccordionState: function(accordions) {
    chrome.extension.sendRequest({
      name: 'saveAccordionState',
      accordions: accordions,
    });
  },

  /**
   * Send request to background page to save an option
   * @param {string} name Option name
   * @param {object} value Option value
   */
  saveOption: function(name, value) {
    chrome.extension.sendRequest({
      name: 'saveOption',
      option: {
        name: name,
        value: value,
      },
    });
  },

  /**
   * Send request to background page to get an option's value
   * @param {string} name Option name
   * @param {function} callback Method to be called with the option value
   */
  getOption: function(name, callback) {
    chrome.extension.sendRequest(
      {
        name: 'getOption',
        optionName: name,
      },
      callback
    );
  },

  /**
   * Open the options page for stylebot
   */
  showOptions: function() {
    chrome.extension.sendRequest({
      name: 'showOptions',
    });
  },
};

/**
 * Listeners for requests sent from elsewhere
 */
chrome.extension.onRequest.addListener(function(
  request,
  _sender,
  sendResponse
) {
  if (window !== window.top) {
    return;
  }

  if (request.name === 'status') {
    sendResponse({
      status: stylebot.status,
      rules: $.isEmptyObject(stylebot.style.rules)
        ? null
        : stylebot.style.rules,
      global: $.isEmptyObject(stylebot.style.global)
        ? null
        : stylebot.style.global,
    });
  } else if (request.name === 'toggle') {
    stylebot.toggle();
    sendResponse({
      status: stylebot.status,
    });
  } else if (request.name === 'setOptions') {
    stylebot.setOptions(request.options);
  } else if (request.name === 'openWidget') {
    stylebot.contextmenu.openWidget();
  } else if (request.name === 'enableStyles') {
    stylebot.style.rules = request.rules;
    stylebot.style.enable();
  } else if (request.name === 'disableStyles') {
    stylebot.style.disable();
  }
});
