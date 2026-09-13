import { test, expect } from './fixtures';

test('opening Stylebot from the right-click menu pre-fills the clicked element\'s selector', async ({
  context,
  extensionId: _extensionId,
}) => {
  const page = await context.newPage();
  await page.goto('https://example.com');
  await page.bringToFront();

  // Playwright can't drive the native browser context menu, so this
  // reproduces exactly what src/background/contextmenu.ts's onClicked
  // handler does: capture the right-click (inject-css's job, still eager),
  // then inject + relay OpenStylebotFromContextMenu (on-demand, Chrome/Edge
  // only, background's job).
  await page.locator('h1').dispatchEvent('contextmenu');

  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const tabs = await worker.evaluate(() => chrome.tabs.query({ active: true }));
  const tabId = (tabs as chrome.tabs.Tab[])[0].id;

  await worker.evaluate(async (id: number) => {
    await chrome.scripting.executeScript({
      target: { tabId: id },
      files: ['editor/index.js'],
    });
    chrome.tabs.sendMessage(id, { name: 'OpenStylebotFromContextMenu' });
  }, tabId);

  await expect(page.locator('.stylebot-body')).toBeVisible();

  // TheCssSelectorInput's value reflects the active selector — proves the
  // handoff via window.__stylebotPendingContextMenuSelector reached the
  // editor.
  await expect(page.locator('input.css-selector-input')).toHaveValue(/h1/i);
});
