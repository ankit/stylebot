/**
 * stylebot.contextmenu
 *
 * Handle actions triggered from the right click context menu
 */
stylebot.contextmenu = {
  cache: {
    el: null
  },

  /**
   * Initialize context menu for a page
   */
  initialize: function() {
    this.attachListeners();
  },

  /**
   * Attach the listener to save the right-clicked element in cache
   *   when the context menu is opened
   */
  attachListeners: function() {
    $(document.body).bind('contextmenu', function(e) {
      stylebot.contextmenu.cache.el = e.target;
    });
  },

  /**
   * Open the stylebot editor
   */
  openWidget: function() {
    if (stylebot.contextmenu.cache.el
      && stylebot.contextmenu.cache.el.nodeType == 1) {
        stylebot.open();
        stylebot.select(stylebot.contextmenu.cache.el);
    }
  }
};
