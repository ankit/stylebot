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
      'fetch',
      'renderStyles',
      'onResetMouseenter',
      'onResetMouseleave',
      'share',
      'open',
      'reset',
      'options',
      'openLink',
      'onStyleMouseenter',
      'onStyleMouseleave',
      'install');

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
    this.$share = $('.share');
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

    this.$share.click(this.share);
    this.$open.click(this.open);
    this.$options.click(this.options);
    this.$reset.click(this.reset)
      .mouseenter(this.onResetMouseenter)
      .mouseleave(this.onResetMouseleave);

    this.fetch(_.bind(function() {
      this.$links = $('.style-link, .style-author');
      this.$style = $('.style-item');

      this.$links.click(this.openLink);
      this.$style.mouseenter(this.onStyleMouseenter)
        .click(this.install);

      this.$menu.mouseleave(this.onStyleMouseleave);
    }, this));
  },

  /**
   * Search for the styles for the current page and render them.
   */
  fetch: function(callback) {
    var searchAPI = 'http://stylebot.me/search_api?q=';

    chrome.tabs.sendRequest(this.tab.id, {
      name: 'getURLAndSocialData'
    },

    _.bind(function(response) {
      $.get(searchAPI + response.url,

        _.bind(function(json) {
          var styles = JSON.parse(json),
              socialId = null;

          // Sort the installed style to the top
          if (response.social && response.social.id) {
            styles = _.sortBy(styles, function(style) {
              socialId = response.social.id;
              return (style.id == socialId) ? -1 : 1;
            });
          }

          this.renderStyles(styles, socialId);
          callback();
        }, this));

    }, this));
  },

  /**
   * Render the given styles
   */
  renderStyles: function(styles, socialId) {
    if (styles.length === 0) {
      this.$menu.html('<li class="disabled"><a>No Styles Found.</a></li>');
      return;
    }

    this.$menu.html('');

    _.each(styles, _.bind(function(style) {
      this.css[style.id] = style.css;

      this.$menu.append(Handlebars.templates['style']({
        title: style.title,
        shortTitle: (style.title.length > 25 ? style.title.substring(0, 25) + '...' : style.title),
        description: style.description.replace(/"/g, '&quot;').replace(/\n/g, '<br>'),
        id: style.id,
        url: style.site,
        styleLink: 'http://stylebot.me/styles/' + style.id,
        featured: (style.featured === '1'),
        timestamp: style.updated_at,
        timeAgo: moment(style.updated_at).fromNow(),
        username: style.username,
        usernameLink: 'http://stylebot.me/users/' + style.username,
        favorites: style.favorites,
        installed: (socialId == style.id)
      }));

    }, this));
  },

  /**
   * Listener for mouseenter on reset option.
   * Trigger a preview after resetting any styling on the page.
   */
  onResetMouseenter: function(e) {
    chrome.tabs.sendRequest(this.tab.id, {
      name: 'previewReset'
    }, function(){});
  },

  /**
   * Listener for mouseleave on reset option.
   * Reset preview of style reset.
   */
  onResetMouseleave: function(e) {
    chrome.tabs.sendRequest(this.tab.id, {
      name: 'resetPreview'
    }, function(){});
  },

  /**
   * Listener for the mouseenter event on styles.
   * Trigger a preview of the style on the current page.
   */
  onStyleMouseenter: function(e) {
    var $el = $(e.target), id;

    if (!$el.hasClass('style-item')) {
      $el = $el.parents('.style-item');
    }

    id = $el.data('id');

    chrome.tabs.sendRequest(this.tab.id, {
      name: 'preview',
      description: $el.data('desc'),
      title: $el.data('title'),
      author: $el.data('author'),
      timeAgo: $el.data('timeago'),
      favCount: $el.data('favcount'),
      css: this.css[id]
    }, function(){});
  },

  /**
   * Listener for the mouseleave event on styles.
   * Reset the preview of the style.
   */
  onStyleMouseleave: function(e) {
    chrome.tabs.sendRequest(this.tab.id, {
      name: 'resetPreview'
    }, function(response){});
  },

  /**
   * Install the clicked style on the current page.
   * Listener for the click event on styles.
   */
  install: function(e) {
    var $el = $(e.target), id;

    if ($el.hasClass('style-link') || $el.hasClass('style-author')) {
      return;
    }

    $('.style-installed').hide();
    $('.style-installed', $el).show();

    if (!$el.hasClass('style-item')) {
      $el = $el.parents('.style-item');
    }

    id = $el.data('id');

    chrome.tabs.sendRequest(this.tab.id, {
      name: 'install',
      id: id,
      title: $el.data('title'),
      timestamp: $el.data('timestamp'),
      url: $el.data('url'),
      css: this.css[id]
    }, function() {});
  },

  /**
   * Open stylebot.me/post with the current page's style
   * information prefilled.
   */
  share: function(e) {
    $(e.target).text('Sharing...').addClass('disabled');
    PostToSocial.init(this.tab);
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
  options: function(e) {
    chrome.tabs.create({
      url: 'options/index.html',
      active: true
    });

    window.close();
  },

  /**
   * Reset the styling for the current page.
   */
  reset: function(e) {
    chrome.tabs.sendRequest(this.tab.id, {
      name: 'reset'
    }, function(){});
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
