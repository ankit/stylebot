// Right click menu
var ContextMenu = {
  ID: "stylebot",
  ENABLE_MENU_ID: "enable_styling",

  /**
    * Initialize the menu
    */
  init: function() {
    ContextMenu.remove();
    if (cache.options.contextMenu) {
      ContextMenu.create('Stylebot', null, null, null, ContextMenu.ID);
      ContextMenu.create('Style Element', ContextMenu.ID, 'openWidget');
      ContextMenu.create('Enable Styling', ContextMenu.ID, 'toggleStyle',
        'checkbox', ContextMenu.ENABLE_MENU_ID);
      ContextMenu.create('View Options...', ContextMenu.ID, 'viewOptions');
      ContextMenu.create('Search...', ContextMenu.ID, 'searchSocial');
      ContextMenu.create('Share...', ContextMenu.ID, 'shareOnSocial');
    }
  },

  create: function(title, parentId, action, type, id) {
    var options = {
      title: title,
      contexts: ['all']
    };

    if (parentId) {
      options.parentId = parentId;
    }

    if (action) {
      options.onclick = function(info, tab) {
        console.log(info);
        sendRequestToTab(tab, action);
      }
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

      // Get style status from the tab we changed to and
      // update the checkbox in the context menu.
      chrome.tabs.sendRequest(tab.id, {name: 'styleStatus'}, function(response) {
        if (response) {
          chrome.contextMenus.update(ContextMenu.ENABLE_MENU_ID, {
            type: "checkbox",
            checked: response.status
          });
        }
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
}
