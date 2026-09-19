import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Locator, Page } from '@playwright/test';
import { closeServer, type Popup, type RunInExtension } from './fixtures';

// Generalizes the inline http.createServer pattern from style-important-override.spec.ts
// to serve multiple paths, for tests that need real multi-page navigation.
export const startTestServer = async (
  routes: Record<string, string>
): Promise<{ baseUrl: string; close: () => Promise<void> }> => {
  const server = http.createServer((req, res) => {
    const html = routes[req.url ?? '/'];

    if (html === undefined) {
      res.writeHead(404);
      res.end();
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });

  await new Promise<void>(resolve => server.listen(0, resolve));
  const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

  return { baseUrl, close: () => closeServer(server) };
};

type SeededStyle = {
  css: string;
  enabled: boolean;
  readability?: boolean;
};

// Generalizes the runInExtension(chrome.storage.local.set(...)) pattern from
// style-important-override.spec.ts to seed multiple, arbitrarily-keyed style patterns.
export const seedStyles = async (
  runInExtension: RunInExtension,
  styles: Record<string, SeededStyle>
): Promise<void> => {
  await runInExtension(
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

// Wraps the popup's "Style this page" toggle flow (see editor-open.spec.ts)
// and waits for the Vue app to actually mount, not just the host to attach.
export const openEditor = async (
  page: Page,
  openPopup: () => Promise<Popup>
): Promise<Locator> => {
  await page.bringToFront();

  const popup = await openPopup();
  await popup.locator('button', { hasText: 'Style this page' }).click();

  const editorRoot = page.locator('#stylebot');
  // Vue mounts TheStylebotApp by replacing the #stylebot-app mount div with
  // its own root element, so the id disappears — wait on its root class instead.
  await editorRoot.locator('.stylebot-app').waitFor({ state: 'attached' });

  return editorRoot;
};

const MODE_LABEL = { basic: 'Basic', code: 'Code', magic: 'Magic' } as const;

export const switchEditorMode = async (
  editorRoot: Locator,
  mode: keyof typeof MODE_LABEL
): Promise<void> => {
  await editorRoot
    .getByRole('button', { name: MODE_LABEL[mode], exact: true })
    .click();
};

// The Monaco iframe is nested inside the editor's open shadow root; Playwright's
// selector engine pierces open shadow roots, so a plain CSS selector reaches it.
export const getMonacoFrame = (page: Page) =>
  page.frameLocator('#stylebot iframe');
