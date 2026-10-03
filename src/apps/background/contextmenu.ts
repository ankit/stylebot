import { t } from '@stylebot/i18n';
import type { OpenStylebotFromContextMenu } from '@stylebot/types';
import { isSupportedUrl } from '@stylebot/saved-styles';

import { supportsEditorSidePanel, openEditorSidePanel } from '@stylebot/utils';

import type { StylebotLayout, StylebotDockLocation } from '@stylebot/types';

import { OpenOptionsPage } from './messages';
import { get as getOption } from './options';

const CONTEXT_MENU_ID = 'stylebot-contextmenu';
const VIEW_OPTIONS_MENU_ITEM_ID = 'view-options';
const STYLE_ELEMENT_MENU_ITEM_ID = 'style-element';
// A click on this one opens the side panel without first reading the dock
// from storage, which would lose the click's gesture.
const STYLE_ELEMENT_IN_SIDE_PANEL_MENU_ITEM_ID = 'style-element-side-panel';

export const ContextMenu = {
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

    getOption('layout').then(layout =>
      this.showDock((layout as StylebotLayout).dockLocation)
    );

    chrome.storage.onChanged.addListener((changes, area) => {
      const layout = changes['options']?.newValue?.layout;
      if (area === 'local' && layout) {
        this.showDock(layout.dockLocation);
      }
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

  update(tab: chrome.tabs.Tab): void {
    if (!tab) {
      return;
    }

    if (tab.url && isSupportedUrl(tab.url)) {
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
