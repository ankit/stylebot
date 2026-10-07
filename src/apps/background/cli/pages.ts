import {
  closeCliWindow,
  getCliWindowId,
  isSamePage,
  openInCliWindow,
  serializeTab,
  waitForLoad,
} from './cli-window';
import { inspectTab, requireNamed, resolveTab } from './targets';
import type { CliCommands } from './types';

// Chrome rate-limits captureVisibleTab, and a freshly activated tab needs a frame to paint.
const PAINT_DELAY_MS = 300;

export const pageCommands: CliCommands = {
  async open({ url, forceNew }) {
    const wanted = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(String(url)) ? String(url) : `https://${url}`
    );
    const windowId = await getCliWindowId();
    // Only the CLI's own tabs, so working in one never touches the user's.
    const existing =
      forceNew || windowId === undefined
        ? undefined
        : (await chrome.tabs.query({ windowId })).find(
            tab => tab.url && isSamePage(new URL(tab.url), wanted)
          );

    if (existing) {
      await chrome.tabs.update(existing.id as number, { active: true });

      if (existing.status !== 'complete') {
        await waitForLoad(existing.id as number);
      }

      return {
        created: false,
        ...serializeTab(await chrome.tabs.get(existing.id as number)),
      };
    }

    const tab = await openInCliWindow(wanted.href);
    await waitForLoad(tab.id as number);

    return {
      created: true,
      ...serializeTab(await chrome.tabs.get(tab.id as number)),
    };
  },

  async tabs() {
    const tabs = await chrome.tabs.query({});
    return tabs.map(serializeTab);
  },

  async outline({ tab }) {
    const { id } = await resolveTab(tab);
    return inspectTab<string>(id as number, { kind: 'outline' });
  },

  async screenshot({ tab }) {
    requireNamed(tab, 'tab');
    const { id, windowId, active } = await resolveTab(tab);

    if (active) {
      return chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
    }

    // Chrome only captures a window's shown tab: show it just for the capture.
    const [shown] = await chrome.tabs.query({ active: true, windowId });
    await chrome.tabs.update(id as number, { active: true });

    try {
      await new Promise(resolve => setTimeout(resolve, PAINT_DELAY_MS));
      return await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
    } finally {
      if (shown?.id !== undefined) {
        await chrome.tabs
          .update(shown.id, { active: true })
          .catch(() => undefined);
      }
    }
  },

  async done() {
    return { closed: await closeCliWindow() };
  },
};
