/**
 * Right click menu
 */
var ContextMenu = {
  ID: 'stylebot',

  /**
   * Initialize the menu
   */
  init: function() {
    ContextMenu.remove();
    if (cache.options.contextMenu) {
      ContextMenu.create('Stylebot', null, null, null, ContextMenu.ID);
      ContextMenu.create('Style Element', ContextMenu.ID, 'openWidget');
      ContextMenu.create('View Options...', ContextMenu.ID, 'showOptions');
    }
  },

  create: function(title, parentId, action, type, id) {
    var options = {
      title: title,
      contexts: ['all']
    }, handler;

    if (parentId) {
      options.parentId = parentId;
    }

    if (action) {
      if (action === 'showOptions') {
        handler = function() {
          chrome.tabs.create({
            url: 'options/index.html',
            active: true
          });
        };
      } else {
        handler = function(info, tab) {
          chrome.tabs.sendRequest(tab.id, {
            name: action
          }, function(){});
        };
      }

      options.onclick = handler;
    }

    if (type) {
      options.type = type;
    }

    if (id) {
      options.id = id;
    }

    return chrome.contextMenus.create(options);
  },

  /**
   * Update the right-click context menu for a tab
   *   show or hide and update checkboxes.
   * @param {object} tab Tab based on which the right-click menu is to be updated
   */
  update: function(tab) {
    if (!tab) {
      return;
    }

    if (tab.url.isValidUrl()) {
      // If it is a valid url, show the contextMenu
      chrome.contextMenus.update(ContextMenu.ID, {
        documentUrlPatterns: ['<all_urls>']
      });
    }

    else {
      // If it isn't a valid url, hide the contextMenu
      // Set the document pattern to foo/*random*
      chrome.contextMenus.update(ContextMenu.ID, {
        documentUrlPatterns: ['http://foo/' + Math.random()]
      });
    }
  },

  /**
   * Remove the right click context menu
   */
  remove: function() {
    chrome.contextMenus.removeAll();
  }
};
