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
  init: function () {
    _.bindAll(
      this,
      'setup',
      'onResetMouseenter',
      'onResetMouseleave',
      'open',
      'reset',
      'options',
      'openLink',
      'onStyleMouseenter',
      'onStyleMouseleave',
      'install'
    );

    chrome.windows.getCurrent({
        populate: true
      },
      _.bind(function (aWindow) {
        var tabs = aWindow.tabs;
        var len = tabs.length;

        for (var i = 0; i < len; i++) {
          if (tabs[i].active) {
            this.setup(tabs[i]);
            break;
          }
        }
      }, this)
    );
  },

  /**
   * Setup the UI and event listeners for the browser action
   */
  setup: function (tab) {
    this.tab = tab;

    this.$menu = $('#menu');
    this.$open = $('.open');
    this.$reset = $('.reset');
    this.$options = $('.options');

    var port = chrome.runtime.connect({
      name: 'browserAction',
    });

    port.postMessage({
      name: 'activeTab',
      tab: tab,
    });

    this.$open.click(this.open);
    this.$options.click(this.options);
    this.$reset
      .click(this.reset)
      .mouseenter(this.onResetMouseenter)
      .mouseleave(this.onResetMouseleave);
  },

  /**
   * Listener for mouseenter on reset option.
   * Trigger a preview after resetting any styling on the page.
   */
  onResetMouseenter: function (e) {
    chrome.tabs.sendRequest(
      this.tab.id, {
        name: 'previewReset',
      },
      function () {}
    );
  },

  /**
   * Listener for mouseleave on reset option.
   * Reset preview of style reset.
   */
  onResetMouseleave: function (e) {
    chrome.tabs.sendRequest(
      this.tab.id, {
        name: 'resetPreview',
      },
      function () {}
    );
  },

  /**
   * Listener for the mouseenter event on styles.
   * Trigger a preview of the style on the current page.
   */
  onStyleMouseenter: function (e) {
    var $el = $(e.target),
      id;

    if (!$el.hasClass('style-item')) {
      $el = $el.parents('.style-item');
    }

    id = $el.data('id');

    chrome.tabs.sendRequest(
      this.tab.id, {
        name: 'preview',
        description: $el.data('desc'),
        title: $el.data('title'),
        author: $el.data('author'),
        timeAgo: $el.data('timeago'),
        favCount: $el.data('favcount'),
        css: this.css[id],
      },
      function () {}
    );
  },

  /**
   * Listener for the mouseleave event on styles.
   * Reset the preview of the style.
   */
  onStyleMouseleave: function (e) {
    chrome.tabs.sendRequest(
      this.tab.id, {
        name: 'resetPreview',
      },
      function (response) {}
    );
  },

  /**
   * Install the clicked style on the current page.
   * Listener for the click event on styles.
   */
  install: function (e) {
    var $el = $(e.target),
      id;

    if ($el.hasClass('style-link') || $el.hasClass('style-author')) {
      return;
    }

    $('.style-installed').hide();
    $('.style-installed', $el).show();

    if (!$el.hasClass('style-item')) {
      $el = $el.parents('.style-item');
    }

    id = $el.data('id');

    chrome.tabs.sendRequest(
      this.tab.id, {
        name: 'install',
        id: id,
        title: $el.data('title'),
        timestamp: $el.data('timestamp'),
        url: $el.data('url'),
        css: this.css[id],
      },
      function () {}
    );
  },

  /**
   * Show stylebot on the current page.
   */
  open: function (e) {
    $(e.target).text('Opening...').addClass('disabled');

    chrome.tabs.sendRequest(
      this.tab.id, {
        name: 'toggle',
      },
      function () {}
    );

    window.close();
  },

  /**
   * Open the options page in a new tab.
   */
  options: function (e) {
    chrome.tabs.create({
      url: 'options/index.html',
      active: true,
    });

    window.close();
  },

  /**
   * Reset the styling for the current page.
   */
  reset: function (e) {
    chrome.tabs.sendRequest(
      this.tab.id, {
        name: 'reset',
      },
      function () {}
    );
  },

  /**
   * Listener for the click event on links in the browser action.
   * By default, links don't open in a browser action.
   */
  openLink: function (e) {
    e.preventDefault();

    chrome.tabs.create({
      url: $(e.target).attr('href'),
      active: false,
    });
  },
};

$(document).ready(function () {
  BrowserAction.init();
});