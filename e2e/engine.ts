import type { BrowserContext, Page } from '@playwright/test';

/*
 * What fixtures.ts needs from a browser engine: launch it, load the built
 * extension into it, and run code with the extension's privileges. chromium.ts
 * and firefox.ts each implement this; nothing else in the suite is engine-aware.
 */

export type ExtensionFunction<A, R> = (arg: A) => R | Promise<R>;

export type LaunchOptions = {
  headless: boolean;
  viewport: null;
  colorScheme: null;
};

export interface Extension {
  readonly id: string;
  // Whether the background (service worker / event page) is currently alive.
  isRunning(): boolean;
  // Mirrors Playwright's `worker.evaluate(fn, arg)`: the result must be JSON-serializable.
  evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R>;
  close(): void;
}

export interface Engine {
  // Build output directory, relative to the repo root.
  distDir: string;
  launch(userDataDir: string, options: LaunchOptions): Promise<BrowserContext>;
  loadExtension(context: BrowserContext, distPath: string): Promise<Extension>;
  // Opens the popup as a page, in the background so the page under test stays the
  // "current tab". Absent on engines where Playwright can't drive extension pages;
  // tests that depend on it are skipped there.
  openPopup?(context: BrowserContext, extension: Extension): Promise<Page>;
}
