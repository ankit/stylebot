import { isWebPageUrl } from '@stylebot/utils';
import type {
  CliModeEvent,
  CliModePageEvent,
  SetAllStyles,
  SetStyle,
} from '@stylebot/types';

import { requireNamed, resolveTab } from '../targets';
import type { CliCommands } from '../types';
import { undoSave } from './activity';
import { forgetInvite, refreshInvites } from './invites';
import { onMark, onUnmark } from './marks';
import { noteCommands, onNote } from './notes';
import { selectionCommands } from './selection';
import { followStyleSave } from './watch';
import { sendToWatchers } from './watchers';
import {
  connectTab,
  disconnect,
  disconnectTab,
  followCliConnection,
  getSession,
  isInCliMode,
  showAgain,
} from './session';

export { ACTIVITY_MS, noteCliActivity, onCliSave } from './activity';
export { getUnreadNotice } from './marks';
export { getCliModeTab, isInCliMode } from './session';
export { STYLE_EDITED_MS, watchStreams } from './watch';

const handlePageEvent = async (
  tabId: number,
  event: CliModePageEvent
): Promise<void> => {
  switch (event.type) {
    case 'connect':
      await connectTab(tabId, { open: true });
      refreshInvites();
      return;

    case 'dismiss':
      forgetInvite(tabId);
      return;
  }

  const session = getSession();

  if (!session || !isInCliMode(tabId)) {
    return;
  }

  switch (event.type) {
    case 'off':
      disconnectTab('off');
      refreshInvites();
      return;

    case 'undo':
      await undoSave(session, event.id);
      return;

    case 'mark':
      onMark(event.n, event.area);
      return;

    case 'unmark':
      onUnmark(event.n);
      return;

    case 'note':
      await onNote(session, event.text, event.marks);
      return;
  }
};

export const modeCommands: CliCommands = {
  async mode({ tab, on }) {
    requireNamed(tab, 'tab');
    const target = await resolveTab(tab);
    const tabId = target.id as number;

    if (on === false) {
      if (isInCliMode(tabId)) {
        disconnect();
        refreshInvites();
      }

      return { tab: tabId, on: false };
    }

    if (!target.url || !isWebPageUrl(target.url)) {
      throw new Error(`Stylebot can't run in tab ${tabId}: ${target.url}`);
    }

    // The agent wants the user there, so the tab comes to the front with
    // the thread open, unlike the CLI's other commands.
    await connectTab(tabId, { open: true, front: true });
    refreshInvites();

    return { tab: tabId, on: true };
  },

  ...selectionCommands,
  ...noteCommands,
};

/**
 * Follows the connected tab and keeps invites on the active tabs. Call it
 * synchronously at service worker start.
 */
export const initCliMode = (): void => {
  chrome.runtime.onMessage.addListener(
    (
      message: CliModeEvent | SetStyle | SetAllStyles,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: null) => void
    ) => {
      if (message?.name === 'SetStyle' || message?.name === 'SetAllStyles') {
        followStyleSave(message);
        return false;
      }

      if (message?.name !== 'CliModeEvent' || sender.tab?.id === undefined) {
        return false;
      }

      // Answered once handled, so the terminal keeps a note's marks on the
      // page until they're read and captured.
      handlePageEvent(sender.tab.id, message.event)
        .catch(e => console.error('Stylebot CLI:', e))
        .finally(() => sendResponse(null));
      return true;
    }
  );

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (isInCliMode(tabId)) {
      // The marks go with the page they were on.
      if (changeInfo.status === 'loading') {
        getSession()?.unreadMarks.clear();
      }

      // A load may report its url again while loading; in-page url changes
      // come on their own.
      if (
        changeInfo.status === 'loading' ||
        (changeInfo.url && tab.status !== 'loading')
      ) {
        sendToWatchers({ type: 'navigated', url: tab.url ?? '' });
      }
    }

    if (changeInfo.status === 'complete') {
      showAgain(tabId);

      // An invite goes with the page it was on; the next one gets its own.
      if (forgetInvite(tabId) || tab.active) {
        refreshInvites();
      }
    }
  });

  chrome.tabs.onActivated.addListener(refreshInvites);

  chrome.tabs.onRemoved.addListener(tabId => {
    forgetInvite(tabId);

    if (isInCliMode(tabId)) {
      disconnectTab('closed');
      refreshInvites();
    }
  });

  followCliConnection();
};
