import type { BrowserContext } from '@playwright/test';
import type { PageFunction } from 'playwright-core/types/structs';
import type { Extension, ExtensionFunction } from '../engine';

// Backed by the MV3 service worker that CDP's Extensions.loadUnpacked started.
export class ChromiumExtension implements Extension {
  constructor(private readonly context: BrowserContext, readonly id: string) {}

  isRunning(): boolean {
    return this.context.serviceWorkers().length > 0;
  }

  async evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R> {
    const worker =
      this.context.serviceWorkers()[0] ??
      (await this.context.waitForEvent('serviceworker'));
    return worker.evaluate(fn as PageFunction<A, R>, arg as A);
  }

  async pressShortcut(
    command: string,
    tabUrl: string,
    times = 1
  ): Promise<void> {
    await this.evaluate(
      async ([name, url, count]) => {
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find(candidate => candidate.url?.startsWith(url));
        // Chrome's events expose the dispatch its own bindings call.
        const event = chrome.commands.onCommand as unknown as {
          dispatch: (command: string, tab?: chrome.tabs.Tab) => void;
        };

        for (let i = 0; i < count; i++) {
          event.dispatch(name, tab);
        }
      },
      [command, tabUrl, times] as const
    );
  }

  close(): void {
    // The worker belongs to the browser context, which the fixture closes.
  }
}
