import {
  closeCliWindow,
  getCliWindowId,
  isSamePage,
  openInCliWindow,
  serializeTab,
  waitForLoad,
} from './cli-window';
import { captureTab } from '../capture-tab';
import { inspectTab, requireNamed, resolveTab } from './targets';
import type { CliCommands } from './types';

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
    const target = await resolveTab(tab);

    return captureTab(target);
  },

  async done() {
    return { closed: await closeCliWindow() };
  },
};
