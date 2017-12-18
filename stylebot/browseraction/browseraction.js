/**
 * BrowserAction menu
 */
var BrowserAction = {
  // Cache of css of styles
  // Key/value pair of style id/css
  css: {},

  /**
   * Initialize the browser action for the currently active tab
   */
  init: function() {
    _.bindAll(this,
      'setup',
      'tempToggle',
      'open',
      'options',
      'openLink');

    chrome.windows.getCurrent({populate: true}, _.bind(function(aWindow) {
      var tabs = aWindow.tabs;
      var len = tabs.length;

      for (var i = 0; i < len; i++) {
        if (tabs[i].active) {
          this.setup(tabs[i]);
          break;
        }
      }
    }, this));
  },

  /**
   * Setup the UI and event listeners for the browser action
   */
  setup: function(tab) {
    this.tab = tab;

    this.$menu = $('#menu');
    this.$open = $('.open');
    this.$reset = $('.reset');
    this.$options = $('.options');

    var port = chrome.runtime.connect({
      name: 'browserAction'
    });

    port.postMessage({
      name: 'activeTab',
      tab: tab
    });

    this.$open.click(this.open);
    this.$options.click(this.options);
    this.$reset.click(this.tempToggle);
  },

  /**
     * Listener for click to toggle disabling stylebot css for this tab.
     * Trigger a preview after resetting any styling on the page.
     */
  tempToggle: function (e) {
    chrome.tabs.sendRequest(this.tab.id, {
      name: 'togglePreview',
      tabId: this.tab.id
    }, function () { });
  },

  /**
   * Show stylebot on the current page.
   */
  open: function(e) {
    $(e.target).text('Opening...').addClass('disabled');

    chrome.tabs.sendRequest(this.tab.id, {
      name: 'toggle'
    }, function() {});

    window.close();
  },

  /**
   * Open the options page in a new tab.
   */
  options: function (e) {
    chrome.tabs.create({
      url: 'options/index.html',
      active: true
    });

    window.close();
  },

  /**
   * Listener for the click event on links in the browser action.
   * By default, links don't open in a browser action.
   */
  openLink: function(e) {
    e.preventDefault();

    chrome.tabs.create({
      url: $(e.target).attr('href'),
      active: false
    });
  }
};

$(document).ready(function() {
  BrowserAction.init();
});
