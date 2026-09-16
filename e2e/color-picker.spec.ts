import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { test, expect } from './fixtures';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head></head>
    <body style="background: #eeeeee;">
      <h1 style="color: #3355ff;">Test page</h1>
      <p style="color: #008800;">Some text</p>
    </body>
  </html>
`;

let server: http.Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(PAGE_HTML);
  });

  await new Promise<void>(resolve => server.listen(0, resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}/`;
});

test.afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('falls back to page colors, then switches to already-used colors once a rule is set', async ({
  context,
  openPopup,
}, testInfo) => {
  // More sequential UI steps than the other specs (autocomplete, popover,
  // reopen) — give it more headroom under parallel-worker CPU contention.
  testInfo.setTimeout(60_000);

  const page = await context.newPage();
  await page.goto(baseUrl);
  await page.bringToFront();

  const popup = await openPopup();

  // The extension's onInstalled help tab can grab focus between the calls
  // above and here, especially under load — reclaim it right before the
  // toggle click so the message lands on our page, not the help tab.
  await page.bringToFront();
  await popup.getByRole('button', { name: /^Style this page/ }).dispatchEvent('click');
  await expect(page.locator('#stylebot')).toBeAttached({ timeout: 30_000 });

  // Enables the (otherwise disabled) property fields — ColorPicker.vue reads
  // `activeSelector` to gate itself, same as every other property control.
  await page.getByPlaceholder('Pick an element').fill('h1');

  const textCard = page
    .locator('.property-card')
    .filter({ has: page.locator('.property-card-label', { hasText: /^Text$/ }) });
  const swatch = textCard.locator('.color-swatch');

  await swatch.click();

  const popover = page.locator('.color-picker-popover');
  const firstTab = popover.locator('.tabs .tab').first();

  // No Stylebot rule exists for this site yet, so the first tab falls back
  // to the live page's own colors rather than showing empty/disabled.
  await expect(firstTab).toHaveText('Page colors');
  await expect(firstTab).toHaveClass(/active/);
  await expect(popover.locator('.first-tab .swatch').first()).toBeVisible();

  const supportsEyeDropper = await page.evaluate(() => typeof window.EyeDropper !== 'undefined');
  const pickButton = popover.locator('.pick');
  if (supportsEyeDropper) {
    await expect(pickButton).toBeVisible();
  } else {
    await expect(pickButton).toHaveCount(0);
  }

  // Set a color via the shared hex/rgb footer field (present on every tab) —
  // this both proves the footer applies a real style, and gives us a known
  // "already used" color to look for once the tab flips over.
  const valueField = popover.locator('.value-field');
  await valueField.fill('#112233');
  await valueField.blur();

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(17, 34, 51)');

  // Close and reopen the popover — the just-applied rule means state.css is
  // no longer empty, so the first tab should now read from it instead.
  await swatch.click();
  await swatch.click();

  await expect(firstTab).toHaveText('Your colors');
  await expect(popover.locator('.used-colors .swatch[style*="17, 34, 51"]')).toBeVisible();

  // The just-applied color was also the one the popover closed on, so it
  // should be recorded in Recent — now shown in this same tab, not Custom.
  await expect(popover.locator('.recent-section')).toBeVisible();
  await expect(popover.locator('.recent-section .swatch[style*="17, 34, 51"]')).toBeVisible();
});
