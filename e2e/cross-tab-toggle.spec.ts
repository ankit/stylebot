import { test, expect } from './fixtures';
import { seedStyles } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

test('disabling/enabling a style propagates live to every open tab on that host', async ({
  context,
  extensionId: _extensionId,
  openPopup,
}) => {
  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  await seedStyles(context, {
    localhost: { css: 'h1 { color: rgb(255, 0, 128); }', enabled: true },
  });

  const tabA = await context.newPage();
  await tabA.goto('http://localhost/');
  await expect(tabA.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  const tabB = await context.newPage();
  await tabB.goto('http://localhost/');
  await expect(tabB.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  // Sends the exact message Style.vue's toggle switch sends
  // (chrome.runtime.sendMessage({name: 'EnableStyle' | 'DisableStyle', url})),
  // from the popup's own extension page context rather than by clicking its
  // checkbox. The checkbox itself can't be exercised in this harness: the
  // popup is opened as a real background tab (via CDP Target.createTarget,
  // see fixtures.ts), which makes chrome.runtime's sender.tab resolve to the
  // popup's own tab instead of the page under test — breaking
  // GetStylesForPage's tab lookup, so the popup never learns a style already
  // exists for this site and stays on its "no style saved" branch, never
  // rendering the toggle. A real toolbar popup has no associated tab and
  // doesn't hit this. EnableStyle/DisableStyle don't depend on sender.tab, so
  // sending the message directly still exercises the real background handler
  // and cross-tab broadcast this test is about.
  const popup = await openPopup();
  // Not returning sendMessage's promise: the background listener (see
  // src/background/listeners.ts) unconditionally returns true from every
  // message case, including these fire-and-forget ones that never call
  // sendResponse — awaiting the promise here would hang until GC.
  await popup.evaluate(() => {
    chrome.runtime.sendMessage({ name: 'DisableStyle', url: 'localhost' });
  });

  // No reload on either tab: propagation is async (chrome.tabs.sendMessage
  // fan-out with no completion signal), so assertions must poll.
  await expect(tabA.locator('h1')).not.toHaveCSS('color', 'rgb(255, 0, 128)');
  await expect(tabB.locator('h1')).not.toHaveCSS('color', 'rgb(255, 0, 128)');

  await popup.evaluate(() => {
    chrome.runtime.sendMessage({ name: 'EnableStyle', url: 'localhost' });
  });

  await expect(tabA.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
  await expect(tabB.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
});
