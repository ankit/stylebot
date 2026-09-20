import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { expect, closeServer, type Extension, type Popup } from './fixtures';

// The editor content script registers its listener only after several async
// round trips to a possibly cold background; on a loaded CI runner that can
// take a while after the page itself has finished loading.
const EDITOR_LISTENER_TIMEOUT_MS = 20_000;

type Route = string | { body: string; headers?: Record<string, string> };

// A real HTTP server for tests that need genuine navigation, several windows,
// or response headers; `servePage` is enough for a single static page.
export const startTestServer = async (
  routes: Record<string, Route>
): Promise<{ baseUrl: string; close: () => Promise<void> }> => {
  const server = http.createServer((req, res) => {
    const route = routes[req.url ?? '/'];

    if (route === undefined) {
      res.writeHead(404);
      res.end();
      return;
    }

    const { body, headers } =
      typeof route === 'string' ? { body: route, headers: {} } : route;
    res.writeHead(200, { 'Content-Type': 'text/html', ...headers });
    res.end(body);
  });

  await new Promise<void>(resolve => server.listen(0, resolve));
  const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

  return { baseUrl, close: () => closeServer(server) };
};

export const PAGE_URL = 'http://localhost/';

// Serves `html` for every http://localhost/ URL without a real server. The
// fixtures unroute after each test, so this never leaks into the next one.
export const servePage = (
  context: BrowserContext,
  html: string
): Promise<void> =>
  context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: html })
  );

type SeededStyle = {
  css: string;
  enabled: boolean;
  readability?: boolean;
};

export const seedStyles = async (
  extension: Extension,
  styles: Record<string, SeededStyle>
): Promise<void> => {
  await extension.evaluate(
    seeded =>
      chrome.storage.local.set({
        styles: Object.fromEntries(
          Object.entries(seeded).map(([url, style]) => [
            url,
            {
              css: style.css,
              enabled: style.enabled,
              readability: style.readability ?? false,
              modifiedTime: new Date().toISOString(),
            },
          ])
        ),
      }),
    styles
  );
};

/**
 * Waits until the editor content script in the popup's target tab answers
 * messages. Its listener is registered only after async init, and the popup's
 * ToggleStylebot / ToggleReadabilityForTab are fire-and-forget — sent before
 * that, they're dropped rather than queued, and the editor never opens.
 */
export const waitForEditorListener = async (popup: Popup): Promise<void> => {
  await expect
    .poll(
      () =>
        // Resolves the tab the same way the popup does (see popup/utils.ts), so
        // this also proves the popup is looking at the page under test.
        popup.evaluate(async () => {
          const { tabs } = await chrome.windows.getCurrent({ populate: true });
          const tab = tabs?.find(t => t.active);
          if (!tab?.id) {
            return false;
          }

          try {
            const response = await chrome.tabs.sendMessage(tab.id, {
              name: 'GetIsStylebotOpen',
            });
            // inject-css listens from document_start but ignores this message,
            // so only a boolean means the editor script itself is listening.
            return typeof response === 'boolean';
          } catch {
            return false;
          }
        }),
      {
        message: 'editor content script never started listening',
        timeout: EDITOR_LISTENER_TIMEOUT_MS,
      }
    )
    .toBe(true);
};

// Opens the editor through the popup's "Style this page" button and waits for
// the Vue app to actually mount, not just the host to attach.
export const openEditor = async (
  page: Page,
  openPopup: () => Promise<Popup>
): Promise<Locator> => {
  await page.bringToFront();

  const popup = await openPopup();
  await waitForEditorListener(popup);
  await popup.locator('button', { hasText: 'Style this page' }).click();

  const editorRoot = page.locator('#stylebot');
  // Vue mounts TheStylebotApp by replacing the #stylebot-app mount div with
  // its own root element, so the id disappears — wait on its root class instead.
  await editorRoot.locator('.stylebot-app').waitFor({ state: 'attached' });

  return editorRoot;
};

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Picks an element with the inspector (active as soon as the editor opens)
// and waits for the selector field to settle on it.
export const pickElement = async (
  page: Page,
  editorRoot: Locator,
  selector: string
): Promise<void> => {
  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);
  await page.locator(selector).click({ force: true });
  await expect(
    editorRoot.locator('.autocomplete-chips .chip').first()
  ).toHaveText(new RegExp(`${escapeRegExp(selector)}$`));
};

const MODE_LABEL = {
  basic: 'Basic',
  code: 'Code',
  presets: 'Presets',
} as const;

export const switchEditorMode = async (
  editorRoot: Locator,
  mode: keyof typeof MODE_LABEL
): Promise<void> => {
  await editorRoot
    .getByRole('tab', { name: MODE_LABEL[mode], exact: true })
    .click();
};

// The Monaco iframe is nested inside the editor's open shadow root; Playwright's
// selector engine pierces open shadow roots, so a plain CSS selector reaches it.
export const getMonacoFrame = (page: Page) =>
  page.frameLocator('#stylebot iframe');

// Pops the open in-page editor out through its More menu and returns the
// window's page. The window surfaces with its final URL already set, so
// filtering the page event by URL sidesteps any other tab opening meanwhile.
export const popOutEditor = async (
  context: BrowserContext,
  page: Page,
  editorRoot: Locator
): Promise<Page> => {
  const popoutPromise = context.waitForEvent('page', p =>
    p.url().includes('/editor-window/index.html')
  );

  await editorRoot.getByRole('button', { name: 'Options' }).click();
  await editorRoot
    .getByRole('button', { name: 'Open in separate window' })
    .click();

  const popout = await popoutPromise;
  await popout.locator('.stylebot-window').waitFor();

  return popout;
};
