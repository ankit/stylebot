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
  GetStylesForIframe,
  EnableStyle,
  DisableStyle,
  SetReadability,
  GetReadabilitySettings,
  SetReadabilitySettings,
  GetImportCss,
  RunGoogleDriveSync,
} from './messages';

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
 * When an existing tab is updated, refresh the context-menu and action.
 */
chrome.tabs.onUpdated.addListener(async (tabId, _, tab) => {
  const option = await getOption('contextMenu');

  if (option && tab.status === 'complete') {
    ContextMenu.update(tab);
  }

  const message: TabUpdated = {
    name: 'TabUpdated',
  };

  chrome.tabs.sendMessage(tabId, message);
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
      case 'GetStylesForIframe':
        GetStylesForIframe(message, sendResponse);
        break;
      case 'EnableStyle':
        EnableStyle(message);
        break;
      case 'DisableStyle':
        DisableStyle(message);
        break;

      case 'SetReadability':
        SetReadability(message);
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
