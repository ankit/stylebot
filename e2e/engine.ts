import type { BrowserContext } from '@playwright/test';

/*
 * What fixtures.ts needs from a browser engine: launch it, load the built
 * extension into it, run code with the extension's privileges, and open the
 * popup. chromium/ and firefox/ each implement this; nothing else in the suite
 * is engine-aware.
 */

export type ExtensionFunction<A, R> = (arg: A) => R | Promise<R>;

export type LaunchOptions = {
  headless: boolean;
  viewport: null;
  colorScheme: null;
};

export type Extension = {
  readonly id: string;
  // Whether the background (service worker / event page) is currently alive.
  isRunning(): boolean;
  // Mirrors Playwright's `worker.evaluate(fn, arg)`: the result must be JSON-serializable.
  evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R>;
  close(): void;
};

/*
 * The popup can't be a Playwright Page on every engine (Firefox refuses to attach
 * to extension pages), so tests drive it through this smaller surface instead.
 * Locators resolve lazily; pair the state checks with `expect.poll` to retry.
 */
export type Popup = {
  // `hasText` narrows to elements whose (whitespace-normalized) text contains the
  // string or matches the regexp, like Playwright's locator option of the same name.
  locator(
    selector: string,
    options?: { hasText?: string | RegExp }
  ): PopupLocator;
  evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R>;
  close(): Promise<void>;
};

export type PopupLocator = {
  locator(
    selector: string,
    options?: { hasText?: string | RegExp }
  ): PopupLocator;
  // Waits for the element, then dispatches a synthetic click — the popup closes
  // itself right after some clicks, which a real click's stability wait would race.
  click(): Promise<void>;
  isVisible(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  isChecked(): Promise<boolean>;
};

export type Engine = {
  // Build output directory, relative to the repo root.
  distDir: string;
  // Whether `context.route()` sees requests the extension itself makes (from its
  // background); Playwright only observes those on Chromium.
  routesExtensionRequests: boolean;
  // Whether extension pages (options, popup) can be opened as Playwright Pages via
  // `page.goto`; Firefox can't attach to moz-extension:// documents (see docs/testing/e2e.md).
  opensExtensionPages: boolean;
  launch(userDataDir: string, options: LaunchOptions): Promise<BrowserContext>;
  loadExtension(context: BrowserContext, distPath: string): Promise<Extension>;
  // Opens the popup in the background so the page under test stays the "current tab".
  openPopup(context: BrowserContext, extension: Extension): Promise<Popup>;
};
