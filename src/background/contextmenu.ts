import BackgroundPageUtils from './utils';

/**
 * Right click menu
 */
const ContextMenu = {
  ID: 'stylebot',

  /**
   * Initialize the menu
   */
  init() {
    ContextMenu.remove();

    if (window.cache.options.contextMenu) {
      ContextMenu.create('Stylebot', null, null, null, ContextMenu.ID);
      ContextMenu.create('Style Element', ContextMenu.ID, 'openWidget');
      ContextMenu.create('View Options...', ContextMenu.ID, 'showOptions');
    }
  },

  create(
    title: string,
    parentId: string | null,
    action: string | null,
    type?: any,
    id?: string
  ) {
    const options: {
      title: string;
      contexts: any; // todo
      parentId?: string;
      onclick?: any; // todo
      type?: any; // todo
      id?: string;
    } = {
      title: title,
      contexts: ['all'],
    };

    if (parentId) {
      options.parentId = parentId;
    }

    let handler;
    if (action) {
      if (action === 'showOptions') {
        handler = () => {
          chrome.tabs.create({
            url: 'options/index.html',
            active: true,
          });
        };
      } else {
        handler = (info: any, tab: chrome.tabs.Tab) => {
          if (tab.id) {
            chrome.tabs.sendRequest(tab.id, {
              name: action,
            });
          }
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
   * Update the right-click context menu for a tab show or hide and update checkboxes.
   */
  update(tab: chrome.tabs.Tab) {
    if (!tab) {
      return;
    }

    if (tab.url && BackgroundPageUtils.isValidUrl(tab.url)) {
      // If it is a valid url, show the contextMenu
      chrome.contextMenus.update(ContextMenu.ID, {
        documentUrlPatterns: ['<all_urls>'],
      });
    } else {
      // If it isn't a valid url, hide the contextMenu
      // Set the document pattern to foo/*random*
      chrome.contextMenus.update(ContextMenu.ID, {
        documentUrlPatterns: ['http://foo/' + Math.random()],
      });
    }
  },

  /**
   * Remove the right click context menu
   */
  remove() {
    chrome.contextMenus.removeAll();
  },
};

export default ContextMenu;
