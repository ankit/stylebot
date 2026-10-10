import type { RunCommand, StylebotCommandName } from '@stylebot/types';
import {
  COMMAND_NAMES,
  closeEditorSidePanel,
  isEditorSidePanelOpen,
  isWebPageUrl,
  supportsEditorSidePanel,
} from '@stylebot/utils';

import * as editorWindow from './editor-window';
import { applyStylesToAllTabs, toggleForPage } from './styles';

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

const runInPage = (tabId: number, command: StylebotCommandName): void => {
  const message: RunCommand = { name: 'RunCommand', command };
  // Reading lastError marks a page without the content script as handled.
  chrome.tabs.sendMessage(tabId, message, () => void chrome.runtime.lastError);
};

/**
 * Toggles the editor where the side panel is the dock. The panel is set up
 * on every tab ahead of time then, so it opens here, before anything is
 * awaited and the shortcut's gesture lapses; elsewhere the open fails and
 * the page toggles its own editor.
 */
const toggleEditorWithSidePanel = (tabId: number): void => {
  const wasOpen = isEditorSidePanelOpen(tabId);
  const opened = chrome.sidePanel.open({ tabId }).then(
    () => true,
    () => false
  );

  Promise.all([wasOpen, opened]).then(([open, didOpen]) => {
    if (open) {
      closeEditorSidePanel(tabId);
    } else if (!didOpen) {
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
    } else if (supportsEditorSidePanel()) {
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
