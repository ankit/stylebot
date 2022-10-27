import { t } from '@stylebot/i18n';
import { OpenStylebotFromContextMenu } from '@stylebot/types';

import BackgroundPageUtils from './utils';

const CONTEXT_MENU_ID = 'stylebot-contextmenu';
const VIEW_OPTIONS_MENU_ITEM_ID = 'view-options';
const STYLE_ELEMENT_MENU_ITEM_ID = 'style-element';

const ContextMenu = {
  init(): void {
    this.remove();

    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Stylebot',
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      contexts: ['all'],
      title: t('style_element'),
      parentId: CONTEXT_MENU_ID,
      id: STYLE_ELEMENT_MENU_ITEM_ID,
    });

    chrome.contextMenus.create({
      contexts: ['all'],
      title: t('view_options'),
      parentId: CONTEXT_MENU_ID,
      id: VIEW_OPTIONS_MENU_ITEM_ID,
    });
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

      return;
    }

    // If it isn't a valid url, hide the contextMenu
    // Set the document pattern to foo/*random*
    chrome.contextMenus.update(CONTEXT_MENU_ID, {
      documentUrlPatterns: ['http://foo/' + Math.random()],
    });
  },

  remove(): void {
    chrome.contextMenus.removeAll();
  },
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case STYLE_ELEMENT_MENU_ITEM_ID:
      if (tab?.id) {
        const message: OpenStylebotFromContextMenu = {
          name: 'OpenStylebotFromContextMenu',
        };

        chrome.tabs.sendMessage(tab.id, message);
      }

      break;

    case VIEW_OPTIONS_MENU_ITEM_ID:
      chrome.tabs.create({
        active: true,
        url: 'options/index.html',
      });

      break;
  }
});

export default ContextMenu;
