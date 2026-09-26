import { test, expect } from './fixtures';
import {
  startTestServer,
  openEditor,
  popOutEditor,
  switchEditorMode,
} from './helpers';

// Editor-open depends on a popup tab-messaging round trip, which can lag
// under a full parallel worker fleet (see e2e/readability.spec.ts).
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

let baseUrl: string;
let closePageServer: () => Promise<void>;

test.beforeAll(async () => {
  ({ baseUrl, close: closePageServer } = await startTestServer({
    '/': PAGE_HTML,
    '/two': PAGE_HTML.replace('Test page', 'Second page'),
  }));
});

test.afterAll(() => closePageServer());

test.beforeEach(({ engine }) => {
  test.skip(
    !engine.opensExtensionPages,
    'Playwright cannot attach to extension pages on this engine'
  );
});

test('popping out hides the in-page panel and opens the editor in its own window', async ({
  context,
  extension,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const editorRoot = await openEditor(page, openPopup);
  const popout = await popOutEditor(context, page, editorRoot);

  await expect(editorRoot.locator('.stylebot')).toHaveCount(0);

  const windows = await extension.evaluate(() => chrome.windows.getAll());
  expect(windows.filter(w => w.type === 'popup')).toHaveLength(1);

  // The strip's rendering is covered in Storybook; here it drives the real
  // tabs API: activating the edited tab from the window.
  const tabBar = popout.locator('.window-tab');
  const other = await context.newPage();
  await other.goto(`${baseUrl}/two`);
  await other.bringToFront();
  const isEditedTabActive = () =>
    extension.evaluate(
      async url => (await chrome.tabs.query({ url }))[0]?.active,
      `${baseUrl}/`
    );
  await expect.poll(isEditedTabActive).toBe(false);

  await tabBar.click();
  await expect.poll(isEditedTabActive).toBe(true);
});

test('edits made in the window apply to the page live and persist', async ({
  context,
  openPopup,
}) => {
  test.slow();

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const editorRoot = await openEditor(page, openPopup);
  const popout = await popOutEditor(context, page, editorRoot);
  await switchEditorMode(popout.locator('.stylebot-app'), 'code');

  await popout.frameLocator('iframe').locator('.monaco-editor').click();
  await popout.keyboard.type('h1 { color: rgb(255, 0, 128); }');
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  // A burst of edits must land in order — a stale echo from the page would
  // otherwise overwrite the newer window state.
  await popout.keyboard.type(' p { color: rgb(0, 128, 0); }');
  await expect(page.locator('p')).toHaveCSS('color', 'rgb(0, 128, 0)');
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  await page.reload();
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
});

test('inspecting from the window picks an element on the page', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const editorRoot = await openEditor(page, openPopup);
  const popout = await popOutEditor(context, page, editorRoot);
  const inspector = popout.locator('.stylebot-inspector');

  await inspector.click();
  await expect(inspector).toHaveClass(/active/);

  await page.bringToFront();
  await page.locator('p.intro').click();

  await expect(popout.locator('.autocomplete-chips .chip').first()).toHaveText(
    'p.intro'
  );
  await expect(inspector).not.toHaveClass(/active/);

  // Placeholders are read from the page over the port.
  const size = popout
    .locator('.property-row', { hasText: 'Size' })
    .locator('.number-input');
  await expect(size).toHaveAttribute('placeholder', '16');
});

test('once undocked, the popup opens and closes the window', async ({
  context,
  extension,
  openPopup,
}) => {
  await extension.evaluate(() =>
    chrome.storage.local.set({
      options: {
        layout: { width: 350, adjustPageLayout: false, dockLocation: 'window' },
      },
    })
  );

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  await page.bringToFront();

  const popoutPromise = context.waitForEvent('page', p =>
    p.url().includes('/editor-window/index.html')
  );
  const popup = await openPopup();
  await popup.locator('button', { hasText: 'Style this page' }).click();
  const popout = await popoutPromise;
  await popout.locator('.stylebot-window').waitFor();

  await expect(page.locator('#stylebot .stylebot')).toHaveCount(0);

  await page.bringToFront();
  const popupAgain = await openPopup();
  const closeButton = popupAgain.locator('button', {
    hasText: 'Close Stylebot',
  });
  await expect.poll(() => closeButton.isVisible()).toBe(true);

  const closed = popout.waitForEvent('close');
  await closeButton.click();
  await closed;
});

test('the close button closes the window', async ({ context, openPopup }) => {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const editorRoot = await openEditor(page, openPopup);
  const popout = await popOutEditor(context, page, editorRoot);

  const closed = popout.waitForEvent('close');
  await popout.getByRole('button', { name: 'Close' }).click();
  await closed;
});

test('closing the tab closes its window', async ({ context, openPopup }) => {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const editorRoot = await openEditor(page, openPopup);
  const popout = await popOutEditor(context, page, editorRoot);

  const closed = popout.waitForEvent('close');
  await page.close();
  await closed;
});

test('docking back from the window shows the panel in the page, in the mode picked there', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const editorRoot = await openEditor(page, openPopup);
  const popout = await popOutEditor(context, page, editorRoot);
  await switchEditorMode(popout.locator('.stylebot-app'), 'presets');

  const closed = popout.waitForEvent('close');
  await popout.getByRole('button', { name: 'Options' }).click();
  await popout.getByRole('button', { name: 'Dock to Left' }).click();
  await closed;

  await expect(editorRoot.locator('.stylebot.left')).toBeVisible();
  await expect(
    editorRoot.getByRole('tab', { name: 'Presets', exact: true })
  ).toHaveAttribute('aria-selected', 'true');
});

test('the window reconnects after the tab navigates', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const editorRoot = await openEditor(page, openPopup);
  const popout = await popOutEditor(context, page, editorRoot);
  const status = popout.getByRole('status');

  await page.goto(`${baseUrl}/two`);
  await expect(status).toBeVisible();
  await expect(status).toBeHidden();

  await switchEditorMode(popout.locator('.stylebot-app'), 'code');
  await popout.frameLocator('iframe').locator('.monaco-editor').click();
  await popout.keyboard.type('h1 { color: rgb(0, 0, 255); }');
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
});
