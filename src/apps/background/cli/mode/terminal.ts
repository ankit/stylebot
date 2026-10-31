import type {
  CliModeAction,
  CliModeMessage,
  ViewportRect,
} from '@stylebot/types';

import { restoreTab } from '../../restore-tabs';

/**
 * Asks a tab's CLI mode terminal to do something and resolves to its answer,
 * rejecting when the page can't answer.
 */
export const sendToTerminal = async <T>(
  tabId: number,
  action: CliModeAction
): Promise<T> => {
  await restoreTab(tabId);

  return new Promise((resolve, reject) => {
    const message: CliModeMessage = { name: 'CliMode', action };

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
 * Runs a capture of a tab, which keeps CLI mode's terminal rather than flashing
 * it away but hides the marks, and resolves to the capture and where the
 * terminal covers the viewport, if the tab shows one.
 */
export const captureWithTerminal = async <T>(
  tabId: number,
  capture: () => Promise<T>
): Promise<{ capture: T; covered: ViewportRect | null }> => {
  const covered = await sendToTerminal<ViewportRect | null>(tabId, {
    kind: 'startCapture',
  }).catch(() => null);

  try {
    return { capture: await capture(), covered };
  } finally {
    if (covered) {
      sendToTerminal(tabId, { kind: 'endCapture' }).catch(() => undefined);
    }
  }
};
