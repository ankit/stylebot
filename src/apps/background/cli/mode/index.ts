import { isWebPageUrl } from '@stylebot/utils';
import type { CliModeEvent, CliModePageEvent } from '@stylebot/types';

import { requireNamed, resolveTab } from '../targets';
import type { CliCommands } from '../types';
import { undoSave } from './activity';
import { forgetInvite, refreshInvites } from './invites';
import { onMark, onUnmark } from './marks';
import { selectionCommands } from './selection';
import {
  connectTab,
  disconnect,
  endSession,
  followCliConnection,
  getSession,
  isInCliMode,
  showAgain,
} from './session';

export { ACTIVITY_MS, noteCliActivity, onCliSave } from './activity';
export { getUnreadNotice } from './marks';
export { getCliModeTab, isInCliMode } from './session';

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
      endSession();
      refreshInvites();
      return;

    case 'undo':
      await undoSave(session, event.id);
      return;

    case 'mark':
      onMark(event.n);
      return;

    case 'unmark':
      onUnmark(event.n);
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
};

/**
 * Follows the connected tab: shows the terminal again after it loads, and
 * ends the session when it closes. Keeps invites on the active tabs while
 * an agent waits. Call it synchronously at service worker start.
 */
export const initCliMode = (): void => {
  chrome.runtime.onMessage.addListener(
    (
      message: CliModeEvent,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: null) => void
    ) => {
      if (message?.name !== 'CliModeEvent' || sender.tab?.id === undefined) {
        return false;
      }

      handlePageEvent(sender.tab.id, message.event)
        .catch(e => console.error('Stylebot CLI:', e))
        .finally(() => sendResponse(null));
      return true;
    }
  );

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // The marks go with the page they were on.
    if (changeInfo.status === 'loading' && isInCliMode(tabId)) {
      getSession()?.unreadMarks.clear();
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
      endSession();
      refreshInvites();
    }
  });

  followCliConnection();
};
