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

  // The popup's toggle can't be clicked: this harness's popup is a real tab, so
  // sender.tab breaks GetStylesForPage. Send the same message its toggle sends.
  const popup = await openPopup();
  // Not awaited: the background listener always returns true without ever
  // calling sendResponse for these, so awaiting would hang until GC.
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
