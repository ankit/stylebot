import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { BrowserContext, Page, TestInfo } from '@playwright/test';
import type { Engine } from './engine';
import { test, expect, type Extension, type Popup } from './fixtures';
import {
  startTestServer,
  openEditor,
  waitForEditorListener,
  waitForSidePanel,
  isSidePanelOpen,
  dockToSidePanel,
} from './helpers';

test.describe.configure({ retries: 2 });

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head><title>Test page</title></head>
    <body>
      <h1>Test page</h1>
      <p class="intro">Intro</p>
    </body>
  </html>
`;

const byLabel = (label: string): string =>
  `document.querySelector('[aria-label="${label}"]')`;

/*
 * This harness's popup is a tab in the page's window, and closing a tab takes
 * the window's side panel with it; a real popup is a bubble beside the tab.
 */
const keepPopupOpen = (popup: Popup) =>
  popup.evaluate(() => {
    window.close = () => undefined;
  });

// The toggle shortcut is a browser command Playwright can't press; the
// popup opens the side panel the same way, straight from its click.
const openSidePanel = async (
  page: Page,
  context: BrowserContext,
  extension: Extension,
  openPopup: () => Promise<Popup>
) => {
  await page.bringToFront();
  const popup = await openPopup();
  await keepPopupOpen(popup);
  await waitForEditorListener(popup);
  await popup.locator('button', { hasText: 'Style this page' }).click();
  return waitForSidePanel(context, extension);
};

let baseUrl: string;
let closePageServer: () => Promise<void>;

test.beforeAll(async () => {
  ({ baseUrl, close: closePageServer } = await startTestServer({
    '/': PAGE_HTML,
  }));
});

test.afterAll(() => closePageServer());

test.beforeEach(({ engine }) => {
  test.skip(!engine.hasSidePanel, 'Only Chromium has a per-tab side panel');
});

test('moving the panel to the side panel hides it in the page', async ({
  context,
  extension,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const editorRoot = await openEditor(page, openPopup);
  await editorRoot.getByRole('button', { name: 'Options' }).click();
  await editorRoot.getByRole('button', { name: 'Open in side panel' }).click();
  await waitForSidePanel(context, extension);

  await expect(editorRoot.locator('.stylebot')).toHaveCount(0);
});

test('the popup opens the side panel once it is the chosen position', async ({
  context,
  extension,
  openPopup,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  await page.bringToFront();

  const popup = await openPopup();
  await keepPopupOpen(popup);
  await waitForEditorListener(popup);
  await popup.locator('button', { hasText: 'Style this page' }).click();
  await waitForSidePanel(context, extension);

  await expect(page.locator('#stylebot .stylebot')).toHaveCount(0);
});

test('the side panel is set up on every tab while it is the chosen position', async ({
  context,
  extension,
}) => {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const panelOptions = () =>
    extension.evaluate(async url => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find(candidate => candidate.url?.startsWith(url));
      return (
        chrome.sidePanel as unknown as {
          getOptions: (options: {
            tabId?: number;
          }) => Promise<{ enabled?: boolean; path?: string }>;
        }
      ).getOptions({ tabId: tab?.id });
    }, baseUrl);

  await dockToSidePanel(extension);
  await expect.poll(panelOptions).toMatchObject({
    enabled: true,
    path: expect.stringContaining('host=sidepanel'),
  });

  await extension.evaluate(() =>
    chrome.storage.local.set({
      options: {
        layout: { width: 360, adjustPageLayout: false, dockLocation: 'right' },
      },
    })
  );
  await expect.poll(panelOptions).toMatchObject({ enabled: false });
});

test('the manifest’s default side panel, there for Vivaldi, stays off', async ({
  extension,
}) => {
  const defaultOptions = () =>
    extension.evaluate(() =>
      (
        chrome.sidePanel as unknown as {
          getOptions: (options: object) => Promise<{ enabled?: boolean }>;
        }
      ).getOptions({})
    );

  await expect.poll(defaultOptions).toMatchObject({ enabled: false });
});

test('the side panel opens with the inspector on', async ({
  context,
  extension,
  openPopup,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  const panel = await openSidePanel(page, context, extension, openPopup);

  await expect
    .poll(() =>
      panel.evaluate(`!!document.querySelector('.stylebot-inspector.active')`)
    )
    .toBe(true);

  await page.locator('h1').click({ force: true });
  await expect
    .poll(() =>
      panel.evaluate(
        `document.querySelector('.autocomplete-chips .part')?.textContent.trim()`
      )
    )
    .toMatch(/h1$/);
});

test('a side panel that shows the editor stays the chosen position', async ({
  context,
  extension,
  openPopup,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  await openSidePanel(page, context, extension, openPopup);

  // Past the background's wait for the panel to load.
  await page.waitForTimeout(3000);
  expect(
    await extension.evaluate(async () => {
      const items = await chrome.storage.local.get([
        'options',
        'chromiumVariant',
      ]);
      return [items['chromiumVariant'], items['options'].layout.dockLocation];
    })
  ).toEqual([undefined, 'sidepanel']);
  expect(await isSidePanelOpen(extension)).toBe(true);
});

test('moving from the side panel to a window closes the panel', async ({
  context,
  extension,
  openPopup,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  const panel = await openSidePanel(page, context, extension, openPopup);

  const popoutPromise = context.waitForEvent(
    'page',
    p =>
      p.url().includes('/editor-window/index.html') &&
      !p.url().includes('host=sidepanel')
  );
  await panel.evaluate(`${byLabel('Options')}.click()`);
  await expect
    .poll(() => panel.evaluate(`!!${byLabel('Open in separate window')}`))
    .toBe(true);
  // The click closes the panel, which Edge does before evaluate can answer.
  await panel.evaluate(
    `setTimeout(() => ${byLabel('Open in separate window')}.click())`
  );

  const popout = await popoutPromise;
  await popout.locator('.stylebot-window').waitFor();
  await expect.poll(() => isSidePanelOpen(extension)).toBe(false);
});

test('docking in the page from the side panel closes the panel', async ({
  context,
  extension,
  openPopup,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  const panel = await openSidePanel(page, context, extension, openPopup);

  await panel.evaluate(`${byLabel('Options')}.click()`);
  await expect
    .poll(() => panel.evaluate(`!!${byLabel('Dock right in page')}`))
    .toBe(true);
  await panel.evaluate(`${byLabel('Dock right in page')}.click()`);

  await expect(page.locator('#stylebot .stylebot.right')).toBeVisible();
  await expect.poll(() => isSidePanelOpen(extension)).toBe(false);
});

test('editor shortcuts typed on the page reach the side panel', async ({
  context,
  extension,
  openPopup,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  const panel = await openSidePanel(page, context, extension, openPopup);
  const selectedTab = () =>
    panel.evaluate(
      `document.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim()`
    );

  await page.locator('h1').click();
  await page.keyboard.press('c');
  await expect.poll(selectedTab).toBe('Code');

  await page.keyboard.press('b');
  await expect.poll(selectedTab).toBe('Basic');
});

test('arrow keys and Enter typed in the side panel drive the inspector', async ({
  context,
  extension,
  openPopup,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  const panel = await openSidePanel(page, context, extension, openPopup);
  await expect
    .poll(() =>
      panel.evaluate(`!!document.querySelector('.stylebot-inspector.active')`)
    )
    .toBe(true);

  const pressInPanel = (key: string) =>
    panel.evaluate(
      `document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '${key}', bubbles: true, cancelable: true }))`
    );

  await page.locator('h1').hover();
  await expect(page.locator('#stylebot-overlay')).not.toHaveCount(0);
  await pressInPanel('ArrowUp');
  await pressInPanel('Enter');

  await expect
    .poll(() =>
      panel.evaluate(
        `document.querySelector('.autocomplete-chips .part')?.textContent.trim()`
      )
    )
    .toMatch(/body$/);
});

test('the inspector hides its overlay while the pointer is off the page', async ({
  context,
  extension,
  openPopup,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  const panel = await openSidePanel(page, context, extension, openPopup);
  await expect
    .poll(() =>
      panel.evaluate(`!!document.querySelector('.stylebot-inspector.active')`)
    )
    .toBe(true);

  const overlay = page.locator('#stylebot-overlay');

  await page.locator('h1').hover();
  await expect(overlay).not.toHaveCount(0);

  await page.evaluate(() =>
    document
      .querySelector('h1')
      ?.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }))
  );
  await expect(overlay).toHaveCount(0);

  await panel.evaluate(
    `document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))`
  );
  await expect(overlay).not.toHaveCount(0);
});

type FreshInstall = {
  context: BrowserContext;
  extension: Extension;
  // How often Stylebot asked to reload itself.
  reloads: () => Promise<number>;
  // Reloads it through CDP, as it asked to, and waits for the new worker.
  reload: () => Promise<Extension>;
  close: () => Promise<void>;
};

/**
 * Launches a browser with a fresh install, which, unlike the suite's
 * extension, doesn't hold the optional sidePanel permission. CDP blocks an
 * extension that reloads itself, so its own reload only gets counted.
 */
const installFresh = async (
  engine: Engine,
  testInfo: TestInfo
): Promise<FreshInstall> => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-e2e-grant-'));
  const extensionDir = path.join(root, 'extension');
  fs.cpSync(path.resolve(__dirname, '..', engine.distDir), extensionDir, {
    recursive: true,
  });

  const context = await engine.launch(path.join(root, 'profile'), {
    headless: testInfo.project.use.headless ?? true,
    viewport: null,
    colorScheme: null,
  });
  await context.route('https://stylebot.dev/**', route =>
    route.fulfill({ contentType: 'text/html', body: '' })
  );

  const extension = await engine.loadExtension(context, extensionDir);
  expect(await extension.evaluate(() => !!chrome.sidePanel)).toBe(false);

  await extension.evaluate(() => {
    const self = globalThis as typeof globalThis & { reloads: number };
    self.reloads = 0;
    Object.defineProperty(chrome.runtime, 'reload', {
      value: () => self.reloads++,
    });
  });

  return {
    context,
    extension,
    reloads: () =>
      extension.evaluate(
        () => (globalThis as typeof globalThis & { reloads: number }).reloads
      ),
    reload: async () => {
      const reloaded = await engine.loadExtension(context, extensionDir);
      await expect
        .poll(() =>
          reloaded.evaluate(() => !!chrome.sidePanel).catch(() => false)
        )
        .toBe(true);
      return reloaded;
    },
    close: async () => {
      await context.close();
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
};

test('a fresh install asks for the side panel, reloads, then opens it', async ({
  engine,
}, testInfo) => {
  test.setTimeout(90_000);
  const fresh = await installFresh(engine, testInfo);
  const { context } = fresh;

  try {
    await dockToSidePanel(fresh.extension);

    const page = await context.newPage();
    await page.goto(`${baseUrl}/`);
    await page.bringToFront();

    const popup = await engine.openPopup(context, fresh.extension);
    await waitForEditorListener(popup);
    await popup.locator('button', { hasText: 'Style this page' }).click();

    await expect.poll(fresh.reloads).toBe(1);
    expect(
      await fresh.extension.evaluate(() =>
        chrome.permissions.contains({ permissions: ['sidePanel'] })
      )
    ).toBe(true);
    expect(await isSidePanelOpen(fresh.extension)).toBe(false);

    const extension = await fresh.reload();

    // The reload ended the gesture, so the editor opens in the page. Checked
    // from the extension, as page.evaluate would hand the page a gesture.
    await expect
      .poll(() =>
        extension.evaluate(async url => {
          const [tab] = await chrome.tabs.query({ url: `${url}/` });
          const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: () =>
              !!document
                .getElementById('stylebot')
                ?.shadowRoot?.querySelector('.stylebot'),
          });
          return result?.result;
        }, baseUrl)
      )
      .toBe(true);
    expect(await isSidePanelOpen(extension)).toBe(false);

    const next = await context.newPage();
    await next.goto(`${baseUrl}/`);
    await openSidePanel(next, context, extension, () =>
      engine.openPopup(context, extension)
    );
    expect(await isSidePanelOpen(extension)).toBe(true);
  } finally {
    await fresh.close();
  }
});

test('picking the side panel in Options gets its permission, so the first open uses it', async ({
  engine,
}, testInfo) => {
  test.setTimeout(90_000);
  const fresh = await installFresh(engine, testInfo);
  const { context } = fresh;
  const optionsUrl = `chrome-extension://${fresh.extension.id}/options.html#/basics`;

  try {
    const options = await context.newPage();
    await options.goto(optionsUrl);
    await options.getByRole('button', { name: 'Side panel' }).click();

    await expect.poll(fresh.reloads).toBe(1);
    expect(
      await fresh.extension.evaluate(() => chrome.storage.local.get('options'))
    ).toMatchObject({ options: { layout: { dockLocation: 'sidepanel' } } });

    await options.close();
    const extension = await fresh.reload();

    await expect
      .poll(() => context.pages().some(page => page.url() === optionsUrl))
      .toBe(true);

    const page = await context.newPage();
    await page.goto(`${baseUrl}/`);
    await openSidePanel(page, context, extension, () =>
      engine.openPopup(context, extension)
    );
    expect(await isSidePanelOpen(extension)).toBe(true);
    expect(await page.locator('#stylebot .stylebot').count()).toBe(0);
  } finally {
    await fresh.close();
  }
});
