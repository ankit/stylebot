import ContextMenu from './contextmenu';

import {
  GetCommands,
  SetCommands,
  GetOption,
  SetOption,
  GetAllOptions,
  OpenOptionsPage,
  OpenDonatePage,
  OpenReportIssuePage,
  SetStyle,
  MoveStyle,
  GetAllStyles,
  SetAllStyles,
  GetStylesForPage,
  EnableStyle,
  DisableStyle,
  SetReadability,
  ReadabilityActiveChanged,
  GetReadabilitySettings,
  SetReadabilitySettings,
  GetImportCss,
  RunGoogleDriveSync,
  GenerateCss,
} from './messages';

import { refreshBadgeForTab } from './styles';
import { get as getOption } from './options';

import {
  TabUpdated,
  BackgroundPageMessage,
  BackgroundPageMessageResponse,
} from '@stylebot/types';

import { setNotification, getReleaseNotificationId } from '@stylebot/utils';

/**
 * Open Help page on installation
 */
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({
      url: 'https://stylebot.dev/help',
    });

    setNotification(getReleaseNotificationId(), true);
  }
});

/**
 * When an existing tab is updated, refresh the context-menu and badge.
 */
chrome.tabs.onUpdated.addListener(async (tabId, _, tab) => {
  if (tab.status === 'complete' && tab.url) {
    await refreshBadgeForTab(tab);
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
      case 'OpenReportIssuePage':
        OpenReportIssuePage();
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
      case 'ReadabilityActiveChanged':
        ReadabilityActiveChanged(message, sender);
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

      case 'GenerateCss':
        GenerateCss(message, sendResponse);
        break;
    }

    return true;
  }
);
