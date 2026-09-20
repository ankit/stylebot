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
  OpenGoogleFontsPage,
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
  GetGoogleWebFontExists,
  RunGoogleDriveSync,
  GetRecentColors,
  AddRecentColor,
} from './messages';

import { refreshBadgeForTab } from './styles';
import { get as getOption, pruneRetired } from './options';
import { isSyncAlarm, updatePeriodicSync } from './sync-scheduler';
import { runGoogleDriveSync, getGoogleDriveSyncEnabled } from '@stylebot/sync';

import {
  TabUpdated,
  BackgroundPageMessage,
  BackgroundPageMessageResponse,
} from '@stylebot/types';

import { setNotification, getReleaseNotificationId } from '@stylebot/utils';

/**
 * Open Help page on installation; clean up retired options on update.
 */
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({
      url: 'https://stylebot.dev/help',
    });

    setNotification(getReleaseNotificationId(), true);
  }

  if (reason === 'update') {
    pruneRetired();
  }
});

/**
 * Scheduled syncs run without a user in front of them, so they never open an
 * auth window; a run that needs one leaves a flag for the UI instead.
 */
chrome.alarms.onAlarm.addListener(alarm => {
  if (isSyncAlarm(alarm.name)) {
    runGoogleDriveSync({ interactive: false });
  }
});

/**
 * The enabled flag is flipped from the options page; the alarms that follow
 * it are owned here so they stay in step no matter which page changed it.
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes['google-drive-sync-enabled']) {
    updatePeriodicSync();
  }
});

/**
 * Pick up what other devices pushed while the browser was closed.
 */
chrome.runtime.onStartup.addListener(async () => {
  if (await getGoogleDriveSyncEnabled()) {
    runGoogleDriveSync({ interactive: false });
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
    const tab = await chrome.tabs.get(activeInfo.tabId).catch(() => undefined);

    if (tab) {
      ContextMenu.update(tab);
    }
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
        OpenOptionsPage(message);
        break;
      case 'OpenDonatePage':
        OpenDonatePage();
        break;
      case 'OpenReportIssuePage':
        OpenReportIssuePage();
        break;
      case 'OpenGoogleFontsPage':
        OpenGoogleFontsPage();
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
      case 'GetGoogleWebFontExists':
        GetGoogleWebFontExists(message, sendResponse);
        break;

      case 'RunGoogleDriveSync':
        RunGoogleDriveSync(message, sendResponse);
        break;

      case 'GetRecentColors':
        GetRecentColors(sendResponse);
        break;
      case 'AddRecentColor':
        AddRecentColor(message, sendResponse);
        break;
    }

    return true;
  }
);
