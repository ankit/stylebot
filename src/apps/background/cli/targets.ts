import { getStylesForPage } from '@stylebot/saved-styles';
import type { InspectPage, PageInspection } from '@stylebot/types';

import { getAll } from '../styles';

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
 * Asks a tab's page about itself and resolves to its answer, rejecting
 * when nothing there answers.
 */
export const inspectTab = <T>(
  tabId: number,
  inspection: PageInspection
): Promise<T> =>
  new Promise((resolve, reject) => {
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
