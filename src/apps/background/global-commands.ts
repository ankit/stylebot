import type { RunCommand, StylebotCommandName } from '@stylebot/types';
import { COMMAND_NAMES, isWebPageUrl } from '@stylebot/utils';
import {
  closeEditorSidePanel,
  isSidePanelGranted,
  isEditorSidePanelOpen,
} from '@stylebot/side-panel';

import * as editorWindow from './editor-window';
import { restoreTab } from './restore-tabs';
import { applyStylesToAllTabs, toggleForPage } from './styles';
import {
  onEditorSidePanelOpened,
  openEditorSidePanelWithFallback,
  opensEditorInSidePanel,
} from './side-panel';

const isCommandName = (command: string): command is StylebotCommandName =>
  COMMAND_NAMES.includes(command as StylebotCommandName);

/**
 * The tab a shortcut acts on: the active one, or, when the separate editor
 * window has focus, the tab that window edits.
 */
const getTarget = (
  tab: chrome.tabs.Tab | undefined
): { tabId: number; fromEditorWindow: boolean } | null => {
  if (!tab?.url) {
    return null;
  }

  if (tab.url.startsWith(chrome.runtime.getURL('editor-window/'))) {
    const tabId = Number(new URL(tab.url).searchParams.get('tabId'));
    return Number.isInteger(tabId) ? { tabId, fromEditorWindow: true } : null;
  }

  // Checked by URL alone: asking the page first would let the shortcut's
  // gesture lapse before the side panel opens. A page Stylebot can't style
  // never answers the command.
  if (tab.id === undefined || !isWebPageUrl(tab.url)) {
    return null;
  }

  return { tabId: tab.id, fromEditorWindow: false };
};

/**
 * Sends the command to the page. After an update, a background tab only gets
 * Stylebot's scripts back when it's first used, so restore it first.
 */
const runInPage = (tabId: number, command: StylebotCommandName): void => {
  const message: RunCommand = { name: 'RunCommand', command };

  restoreTab(tabId).then(() =>
    // Reading lastError marks a page without the content script as handled.
    chrome.tabs.sendMessage(tabId, message, () => void chrome.runtime.lastError)
  );
};

/**
 * Toggles the editor where the side panel is the dock, opening it before the
 * shortcut's gesture lapses. Falls back to the page's own editor.
 */
const toggleEditorWithSidePanel = (tabId: number): void => {
  if (!isSidePanelGranted()) {
    openEditorSidePanelWithFallback(tabId).catch(() =>
      runInPage(tabId, 'stylebot')
    );
    return;
  }

  const wasOpen = isEditorSidePanelOpen(tabId);
  const opened = chrome.sidePanel.open({ tabId }).then(
    () => true,
    () => false
  );

  Promise.all([wasOpen, opened]).then(([open, didOpen]) => {
    if (open) {
      closeEditorSidePanel(tabId);
    } else if (didOpen) {
      onEditorSidePanelOpened(tabId);
    } else {
      runInPage(tabId, 'stylebot');
    }
  });
};

/**
 * Toggles the tab's style here rather than in the page, which would load the
 * editor first and decide from a copy of the style that lags quick presses.
 */
const toggleStyle = async (tabId: number): Promise<void> => {
  const { url } = await chrome.tabs.get(tabId);

  if (url) {
    await toggleForPage(url);
    await applyStylesToAllTabs();
  }
};

/**
 * Carries out a global shortcut the browser caught, wherever focus was.
 */
export const handleCommand = (
  command: string,
  tab: chrome.tabs.Tab | undefined
): void => {
  const target = getTarget(tab);

  if (!target || !isCommandName(command)) {
    return;
  }

  if (command === 'stylebot') {
    if (target.fromEditorWindow) {
      editorWindow.close(target.tabId);
    } else if (opensEditorInSidePanel()) {
      toggleEditorWithSidePanel(target.tabId);
    } else {
      runInPage(target.tabId, command);
    }
    return;
  }

  if (command === 'style') {
    toggleStyle(target.tabId).catch(() => undefined);
    return;
  }

  runInPage(target.tabId, command);
};
