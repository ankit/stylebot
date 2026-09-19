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

  close(): void {}
}
