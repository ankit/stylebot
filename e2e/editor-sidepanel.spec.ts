import { test, expect } from './fixtures';
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
  await waitForEditorListener(popup);
  await popup.locator('button', { hasText: 'Style this page' }).click();
  await waitForSidePanel(context, extension);

  await expect(page.locator('#stylebot .stylebot')).toHaveCount(0);
});

test('the keyboard shortcut opens the side panel and closes it again', async ({
  context,
  extension,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  await page.bringToFront();
  await page.locator('h1').click();

  await page.keyboard.press('Alt+Shift+M');
  await waitForSidePanel(context, extension);
  await expect(page.locator('#stylebot .stylebot')).toHaveCount(0);

  await page.keyboard.press('Alt+Shift+M');
  await expect.poll(() => isSidePanelOpen(extension)).toBe(false);
  await expect(page.locator('#stylebot .stylebot')).toHaveCount(0);
});

test('moving from the side panel to a window closes the panel', async ({
  context,
  extension,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  await page.bringToFront();
  await page.locator('h1').click();

  await page.keyboard.press('Alt+Shift+M');
  const panel = await waitForSidePanel(context, extension);

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
  await panel.evaluate(`${byLabel('Open in separate window')}.click()`);

  const popout = await popoutPromise;
  await popout.locator('.stylebot-window').waitFor();
  await expect.poll(() => isSidePanelOpen(extension)).toBe(false);
});

test('docking in the page from the side panel closes the panel', async ({
  context,
  extension,
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  await page.bringToFront();
  await page.locator('h1').click();

  await page.keyboard.press('Alt+Shift+M');
  const panel = await waitForSidePanel(context, extension);

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
}) => {
  await dockToSidePanel(extension);

  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  await page.bringToFront();
  await page.locator('h1').click();

  await page.keyboard.press('Alt+Shift+M');
  const panel = await waitForSidePanel(context, extension);
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
