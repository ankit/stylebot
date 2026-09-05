import ContextMenu from './contextmenu';

import {
  GetCommands,
  SetCommands,
  GetOption,
  SetOption,
  GetAllOptions,
  OpenOptionsPage,
  OpenDonatePage,
  SetStyle,
  MoveStyle,
  GetAllStyles,
  SetAllStyles,
  GetStylesForPage,
  EnableStyle,
  DisableStyle,
  SetReadability,
  GetReadabilitySettings,
  SetReadabilitySettings,
  GetImportCss,
  RunGoogleDriveSync,
} from './messages';

import { getAll, updateIcon } from './styles';
import { getStylesForPage } from '@stylebot/styles';
import { get as getOption } from './options';

import {
  TabUpdated,
  BackgroundPageMessage,
  BackgroundPageMessageResponse,
} from '@stylebot/types';

import { setNotification } from '@stylebot/utils';

/**
 * Open Help page on installation
 */
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({
      url: 'https://stylebot.dev/help',
    });

    setNotification('release/3.1', true);
  }
});

/**
 * When an existing tab is updated, refresh the context-menu, badge and
 * action. The badge is refreshed here (rather than in response to the
 * content script's own initial styles lookup) since that lookup now reads
 * chrome.storage.local directly and no longer messages the background page.
 */
chrome.tabs.onUpdated.addListener(async (tabId, _, tab) => {
  if (tab.status === 'complete' && tab.url) {
    const allStyles = await getAll();
    const { styles, defaultStyle } = getStylesForPage(tab.url, allStyles);
    updateIcon(tab, styles, defaultStyle);
  }

  const option = await getOption('contextMenu');

  if (option && tab.status === 'complete') {
    ContextMenu.update(tab);

    const message: TabUpdated = {
      name: 'TabUpdated',
    };

    if (!tab.url?.includes('chrome-extension://')) {
      chrome.tabs.sendMessage(tabId, message);
    }
  }
});

/**
 * Listen when a tab is activated to refresh the context-menu.
 */
chrome.tabs.onActivated.addListener(async activeInfo => {
  const option = await getOption('contextMenu');

  if (option) {
    chrome.tabs.get(activeInfo.tabId, tab => {
      ContextMenu.update(tab);
    });
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: BackgroundPageMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: BackgroundPageMessageResponse) => void
  ) => {
    switch (message.name) {
      case 'GetCommands':
        GetCommands(sendResponse);
        break;
      case 'SetCommands':
        SetCommands(message);
        break;

      case 'GetOption':
        GetOption(message, sendResponse);
        break;
      case 'SetOption':
        SetOption(message);
        break;
      case 'GetAllOptions':
        GetAllOptions(sendResponse);
        break;

      case 'OpenOptionsPage':
        OpenOptionsPage();
        break;
      case 'OpenDonatePage':
        OpenDonatePage();
        break;

      case 'SetStyle':
        SetStyle(message);
        break;
      case 'MoveStyle':
        MoveStyle(message);
        break;
      case 'GetAllStyles':
        GetAllStyles(sendResponse);
        break;
      case 'SetAllStyles':
        SetAllStyles(message);
        break;
      case 'GetStylesForPage':
        GetStylesForPage(message, sender, sendResponse);
        break;
      case 'EnableStyle':
        EnableStyle(message);
        break;
      case 'DisableStyle':
        DisableStyle(message);
        break;

      case 'SetReadability':
        SetReadability(message, sender);
        break;
      case 'GetReadabilitySettings':
        GetReadabilitySettings(sendResponse);
        break;
      case 'SetReadabilitySettings':
        SetReadabilitySettings(message);
        break;

      case 'GetImportCss':
        GetImportCss(message, sendResponse);
        break;

      case 'RunGoogleDriveSync':
        RunGoogleDriveSync(message, sendResponse);
        break;
    }

    return true;
  }
);
