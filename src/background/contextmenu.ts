import BackgroundPageUtils from './utils';
import { OpenStylebot } from '@stylebot/types';

const CONTEXT_MENU_ID = 'stylebot-contextmenu';

const StyleElementContextMenu = () => {
  chrome.contextMenus.create({
    contexts: ['all'],
    title: 'Style Element',
    parentId: CONTEXT_MENU_ID,

    onclick: (_info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => {
      if (tab.id) {
        const message: OpenStylebot = {
          name: 'OpenStylebot',
        };

        chrome.tabs.sendMessage(tab.id, message);
      }
    },
  });
};

const ParentContextMenu = () => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Stylebot',
    contexts: ['all'],
  });
};

const ViewOptionsContextMenu = () => {
  chrome.contextMenus.create({
    contexts: ['all'],
    title: 'Options...',
    parentId: CONTEXT_MENU_ID,
    onclick: () => {
      chrome.tabs.create({
        active: true,
        url: 'options/index.html',
      });
    },
  });
};

const ContextMenu = {
  init(): void {
    this.remove();

    ParentContextMenu();
    StyleElementContextMenu();
    ViewOptionsContextMenu();
  },

  update(tab: chrome.tabs.Tab): void {
    if (!tab) {
      return;
    }

    if (tab.url && BackgroundPageUtils.isValidUrl(tab.url)) {
      // If it is a valid url, show the contextMenu
      chrome.contextMenus.update(CONTEXT_MENU_ID, {
        documentUrlPatterns: ['<all_urls>'],
      });
    } else {
      // If it isn't a valid url, hide the contextMenu
      // Set the document pattern to foo/*random*
      chrome.contextMenus.update(CONTEXT_MENU_ID, {
        documentUrlPatterns: ['http://foo/' + Math.random()],
      });
    }
  },

  remove(): void {
    chrome.contextMenus.removeAll();
  },
};

export default ContextMenu;
