import { isWebPageUrl } from '@stylebot/utils';
import type { CliModeEvent, CliModePageEvent } from '@stylebot/types';

import { requireNamed, resolveTab } from '../targets';
import type { CliCommands } from '../types';
import { undoSave } from './activity';
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
export { getCliModeTab, isInCliMode } from './session';

/**
 * Connects a tab to CLI mode, or disconnects it if it is, for the shortcut.
 */
export const toggleCliMode = async (tabId: number): Promise<void> => {
  if (isInCliMode(tabId)) {
    disconnect();
  } else {
    await connectTab(tabId, { open: true });
  }
};

const handlePageEvent = async (
  tabId: number,
  event: CliModePageEvent
): Promise<void> => {
  const session = getSession();

  if (!session || !isInCliMode(tabId)) {
    return;
  }

  switch (event.type) {
    case 'off':
      endSession();
      return;

    case 'undo':
      await undoSave(session, event.id);
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
      }

      return { tab: tabId, on: false };
    }

    if (!target.url || !isWebPageUrl(target.url)) {
      throw new Error(`Stylebot can't run in tab ${tabId}: ${target.url}`);
    }

    // The agent wants the user there, so the tab comes to the front with
    // the thread open, unlike the CLI's other commands.
    await connectTab(tabId, { open: true, front: true });

    return { tab: tabId, on: true };
  },
};

/**
 * Follows the connected tab: shows the terminal again after it loads, and
 * ends the session when it closes. Call it synchronously at service worker
 * start.
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

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      showAgain(tabId);
    }
  });

  chrome.tabs.onRemoved.addListener(tabId => {
    if (isInCliMode(tabId)) {
      endSession();
    }
  });

  followCliConnection();
};
