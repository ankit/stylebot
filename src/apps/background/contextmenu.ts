import { t } from '@stylebot/i18n';
import type { OpenStylebotFromContextMenu } from '@stylebot/types';
import {
  getPageSupport,
  supportsEditorSidePanel,
  openEditorSidePanel,
} from '@stylebot/utils';

import type { StylebotDockLocation } from '@stylebot/types';

import { OpenOptionsPage } from './messages';
import { getAll as getAllOptions } from './options';

const CONTEXT_MENU_ID = 'stylebot-contextmenu';

// Each update asks its tab first; only the latest one may apply its answer.
let latestUpdate = 0;
const VIEW_OPTIONS_MENU_ITEM_ID = 'view-options';
const STYLE_ELEMENT_MENU_ITEM_ID = 'style-element';
// A click on this one opens the side panel without first reading the dock
// from storage, which would lose the click's gesture.
const STYLE_ELEMENT_IN_SIDE_PANEL_MENU_ITEM_ID = 'style-element-side-panel';

export const ContextMenu = {
  shown: undefined as boolean | undefined,

  init(): void {
    this.sync();

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes['options']) {
        this.sync();
      }
    });
  },

  /**
   * Adds or removes the menu to match the contextMenu option, and shows the
   * Style element item for where the editor is docked.
   */
  async sync(): Promise<void> {
    const { contextMenu, layout } = await getAllOptions();

    if (contextMenu !== this.shown) {
      this.shown = contextMenu;
      this.remove();

      if (contextMenu) {
        this.create();
      }
    }

    if (contextMenu) {
      this.showDock(layout.dockLocation);
    }
  },

  create(): void {
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
      title: t('style_element'),
      parentId: CONTEXT_MENU_ID,
      id: STYLE_ELEMENT_IN_SIDE_PANEL_MENU_ITEM_ID,
      visible: false,
    });

    chrome.contextMenus.create({
      contexts: ['all'],
      title: t('view_options'),
      parentId: CONTEXT_MENU_ID,
      id: VIEW_OPTIONS_MENU_ITEM_ID,
    });
  },

  /**
   * Shows the Style element item that opens the editor where it is docked.
   */
  showDock(dockLocation: StylebotDockLocation): void {
    const sidePanel = dockLocation === 'sidepanel' && supportsEditorSidePanel();

    chrome.contextMenus.update(STYLE_ELEMENT_MENU_ITEM_ID, {
      visible: !sidePanel,
    });
    chrome.contextMenus.update(STYLE_ELEMENT_IN_SIDE_PANEL_MENU_ITEM_ID, {
      visible: sidePanel,
    });
  },

  async update(tab: chrome.tabs.Tab): Promise<void> {
    if (!tab) {
      return;
    }

    const update = ++latestUpdate;
    const supported = (await getPageSupport(tab)) === 'supported';

    if (update !== latestUpdate) {
      return;
    }

    if (supported) {
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

/**
 * Handles a click on one of Stylebot's context menu items.
 */
export const handleContextMenuClick = (
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): void => {
  switch (info.menuItemId) {
    case STYLE_ELEMENT_MENU_ITEM_ID:
    case STYLE_ELEMENT_IN_SIDE_PANEL_MENU_ITEM_ID:
      if (tab?.id) {
        const sidePanel =
          info.menuItemId === STYLE_ELEMENT_IN_SIDE_PANEL_MENU_ITEM_ID;

        if (sidePanel) {
          openEditorSidePanel(tab.id).catch(() => undefined);
        }

        const message: OpenStylebotFromContextMenu = {
          name: 'OpenStylebotFromContextMenu',
          sidePanel,
        };

        chrome.tabs.sendMessage(tab.id, message);
      }

      break;

    case VIEW_OPTIONS_MENU_ITEM_ID:
      OpenOptionsPage();
      break;
  }
};
