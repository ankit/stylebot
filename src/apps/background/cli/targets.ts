import { getStylesForPage } from '@stylebot/saved-styles';
import type { InspectPage, PageInspection } from '@stylebot/types';

import { restoreTab } from '../restore-tabs';
import { getAll } from '../styles';
import { getCliWindowId } from './cli-window';

/**
 * The tab a request names by id, or the focused window's active tab.
 */
export const resolveTab = async (tab: unknown): Promise<chrome.tabs.Tab> => {
  if (tab !== undefined && tab !== null && tab !== '') {
    if (!/^\d+$/.test(String(tab))) {
      throw new Error(`Not a tab id: ${tab}`);
    }

    return chrome.tabs.get(Number(tab));
  }

  const [active] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (!active) {
    throw new Error('No active tab');
  }

  return active;
};

/**
 * Rejects a command that changes a style or a tab without naming which: the
 * active tab can change under a command an agent runs in several steps.
 */
export const requireNamed = (value: unknown, what: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new Error(
      `Name the ${what}: this command doesn't default to the active tab`
    );
  }
};

/**
 * The style key a request names: a url pattern as given, or for a tab the
 * most specific style matching it, else its hostname as the editor would key it.
 */
export const resolveStyleUrl = async (target: unknown): Promise<string> => {
  if (typeof target === 'string' && target && !/^\d+$/.test(target)) {
    return target;
  }

  const tab = await resolveTab(target);
  const url = tab.url ?? '';
  const { defaultStyle } = getStylesForPage(url, await getAll());

  return defaultStyle?.url ?? new URL(url).hostname;
};

/**
 * Asks a tab's page about itself, once a tab an update left for later has
 * Stylebot back, and resolves to its answer, rejecting when nothing answers.
 */
export const inspectTab = async <T>(
  tabId: number,
  inspection: PageInspection
): Promise<T> => {
  await restoreTab(tabId);

  return new Promise((resolve, reject) => {
    const message: InspectPage = { name: 'InspectPage', inspection };

    chrome.tabs.sendMessage(tabId, message, (response: T) => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(new Error(error.message));
      } else if (
        response &&
        typeof response === 'object' &&
        'error' in response
      ) {
        reject(new Error(String(response.error)));
      } else {
        resolve(response);
      }
    });
  });
};

/**
 * The tab to check the style for a url pattern on, and the other tabs that
 * show a page it applies to: the tab the target names, else the active tab
 * of the CLI's own window, where `stylebot open` shows pages, else any.
 */
export const findTabShowing = async (
  url: string,
  target: unknown
): Promise<{ tab?: chrome.tabs.Tab; others: Array<number> }> => {
  const tabId = /^\d+$/.test(String(target)) ? Number(target) : undefined;
  const cliWindowId = await getCliWindowId();
  const showing = (await chrome.tabs.query({})).filter(
    tab =>
      tab.url &&
      getStylesForPage(tab.url, { [url]: { css: '' } }).defaultStyle?.url ===
        url
  );

  if (tabId !== undefined) {
    return { tab: showing.find(tab => tab.id === tabId), others: [] };
  }

  const activeInCliWindow = showing.find(
    tab => tab.active && tab.windowId === cliWindowId
  );
  const tab = activeInCliWindow ?? showing[0];
  const others = showing.filter(other => other !== tab).map(other => other.id!);

  return { tab, others };
};
