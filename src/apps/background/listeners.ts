import { ContextMenu, handleContextMenuClick } from './contextmenu';
import { handleCommand } from './global-commands';
import { configureSidePanelTabs, initSidePanelTabs } from './side-panel-tabs';
import * as editorWindow from './editor-window';

import {
  GetCommands,
  GetOption,
  SetOption,
  GetAllOptions,
  OpenOptionsPage,
  OpenShortcutsPage,
  GoogleSignInRedirect,
  OpenDonatePage,
  OpenReportIssuePage,
  SetStyle,
  MoveStyle,
  GetAllStyles,
  SetAllStyles,
  GetStylesForPage,
  EnableStyle,
  DisableStyle,
  SetActiveProfile,
  CreateProfile,
  InstallStyle,
  RenameProfile,
  DeleteProfile,
  SetReadability,
  ReadabilityActiveChanged,
  GetReadabilitySettings,
  SetReadabilitySettings,
  GetImportCss,
  GetCompiledStyles,
  GetGoogleWebFontExists,
  GetGoogleFontFile,
  RunGoogleDriveSync,
  ScanVersionHistory,
  RestoreVersion,
  GetRecentColors,
  AddRecentColor,
  OpenEditorWindow,
  ToggleEditorWindow,
  CloseEditorWindow,
  GetIsEditorWindowOpen,
  OpenEditorSidePanel,
  CloseEditorSidePanel,
  ChatGetStatus,
  ChatConnect,
  ChatRemoveKey,
  ChatSetModel,
  ChatGetThread,
  ChatSetThread,
} from './messages';
import { initChatPort } from './chat';

import { refreshAllBadges, refreshBadgeForTab } from './styles';
import * as styleStorage from './styles';
import { get as getOption, pruneRetired } from './options';
import {
  AWAY_SECONDS,
  isSyncAlarm,
  updatePeriodicSync,
} from './sync-scheduler';
import {
  runGoogleDriveSync,
  getGoogleDriveSyncEnabled,
  SYNC_ISSUE_KEYS,
} from '@stylebot/sync';

import type {
  TabUpdated,
  BackgroundPageMessage,
  BackgroundPageMessageResponse,
} from '@stylebot/types';

import {
  setNotification,
  getReleaseNotificationId,
  recordInstallTime,
} from '@stylebot/utils';

/**
 * Registers the background's Chrome listeners. They must be registered
 * synchronously when the service worker starts, for Chrome to wake it for them.
 */
export const initListeners = (): void => {
  // Set up side panels and open the welcome page on install; clean up retired options on update.
  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    configureSidePanelTabs();

    if (reason === 'install' || reason === 'update') {
      recordInstallTime();
    }

    if (reason === 'install') {
      chrome.tabs.create({
        url: 'https://stylebot.dev/welcome',
      });

      setNotification(getReleaseNotificationId(), true);
    }

    if (reason === 'update') {
      pruneRetired();
    }
  });

  chrome.commands.onCommand.addListener(handleCommand);
  initSidePanelTabs();

  // Scheduled syncs run without a user in front of them, so they never open an
  // auth window; a run that needs one leaves a flag for the UI instead.
  chrome.alarms.onAlarm.addListener(alarm => {
    if (isSyncAlarm(alarm.name)) {
      runGoogleDriveSync(styleStorage, { interactive: false });
    }
  });

  // Safari has no idle API; there the popup and the alarm still sync.
  if (chrome.idle) {
    chrome.idle.setDetectionInterval(AWAY_SECONDS);
    chrome.idle.onStateChanged.addListener(async state => {
      if (state === 'active' && (await getGoogleDriveSyncEnabled())) {
        runGoogleDriveSync(styleStorage, { interactive: false });
      }
    });
  }

  // The enabled flag is flipped from the options page; the alarms and the
  // badge that follow it are owned here so they stay in step no matter which
  // page changed it.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
      return;
    }

    if (changes['google-drive-sync-enabled']) {
      updatePeriodicSync();
    }

    if (SYNC_ISSUE_KEYS.some(key => changes[key])) {
      refreshAllBadges();
    }
  });

  // Pick up what other devices pushed while the browser was closed.
  chrome.runtime.onStartup.addListener(async () => {
    configureSidePanelTabs();

    if (await getGoogleDriveSyncEnabled()) {
      runGoogleDriveSync(styleStorage, { interactive: false });
    }
  });

  // When an existing tab is updated, refresh the context-menu and badge.
  // A closed tab takes its editor window with it; a closed window is forgotten.
  chrome.tabs.onRemoved.addListener(tabId => {
    editorWindow.close(tabId);
  });

  chrome.windows.onRemoved.addListener(windowId => {
    editorWindow.forgetWindow(windowId);
  });

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

  // Listen when a tab is activated to refresh the context-menu.
  chrome.tabs.onActivated.addListener(async activeInfo => {
    const option = await getOption('contextMenu');

    if (option) {
      const tab = await chrome.tabs
        .get(activeInfo.tabId)
        .catch(() => undefined);

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
        case 'OpenShortcutsPage':
          OpenShortcutsPage();
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
          SetAllStyles(message, sendResponse);
          break;
        case 'GetStylesForPage':
          GetStylesForPage(sender, sendResponse);
          break;
        case 'EnableStyle':
          EnableStyle(message);
          break;
        case 'DisableStyle':
          DisableStyle(message);
          break;
        case 'SetActiveProfile':
          SetActiveProfile(message);
          break;
        case 'CreateProfile':
          CreateProfile(message, sendResponse);
          break;
        case 'InstallStyle':
          InstallStyle(message, sender, sendResponse);
          break;
        case 'RenameProfile':
          RenameProfile(message);
          break;
        case 'DeleteProfile':
          DeleteProfile(message);
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
        case 'GetCompiledStyles':
          GetCompiledStyles(sendResponse);
          break;
        case 'GetGoogleWebFontExists':
          GetGoogleWebFontExists(message, sendResponse);
          break;
        case 'GetGoogleFontFile':
          GetGoogleFontFile(message, sendResponse);
          break;

        case 'RunGoogleDriveSync':
          RunGoogleDriveSync(message, sendResponse);
          break;
        case 'GoogleSignInRedirect':
          GoogleSignInRedirect(message, sender);
          break;
        case 'ScanVersionHistory':
          ScanVersionHistory(message, sendResponse);
          break;
        case 'RestoreVersion':
          RestoreVersion(message, sendResponse);
          break;

        case 'GetRecentColors':
          GetRecentColors(sendResponse);
          break;
        case 'AddRecentColor':
          AddRecentColor(message, sendResponse);
          break;

        case 'OpenEditorWindow':
          OpenEditorWindow(message, sender);
          break;
        case 'ToggleEditorWindow':
          ToggleEditorWindow(message, sender);
          break;
        case 'CloseEditorWindow':
          CloseEditorWindow(message, sender);
          break;
        case 'GetIsEditorWindowOpen':
          GetIsEditorWindowOpen(message, sender, sendResponse);
          break;
        case 'OpenEditorSidePanel':
          OpenEditorSidePanel(message, sender, sendResponse);
          break;
        case 'CloseEditorSidePanel':
          CloseEditorSidePanel(message, sender);
          break;

        case 'ChatGetStatus':
          ChatGetStatus(sendResponse);
          break;
        case 'ChatConnect':
          ChatConnect(message, sendResponse);
          break;
        case 'ChatRemoveKey':
          ChatRemoveKey(message, sendResponse);
          break;
        case 'ChatSetModel':
          ChatSetModel(message, sendResponse);
          break;
        case 'ChatGetThread':
          ChatGetThread(message, sendResponse);
          break;
        case 'ChatSetThread':
          ChatSetThread(message);
          break;
      }

      return true;
    }
  );

  initChatPort();

  chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
};
