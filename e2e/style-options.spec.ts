import { test, expect } from './fixtures';
import {
  PAGE_URL,
  seedStyles,
  servePage,
  waitForEditorListener,
} from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

const CSS = `/* ==UserStyle==
@var select accent "Accent" {"pink:Pink*": "rgb(255, 0, 128)", "blue:Blue": "rgb(0, 0, 255)"}
@var checkbox rounded "Rounded corners" 0
==/UserStyle== */
h1 { color: var(--accent); }
:root[data-stylebot-rounded='1'] h1 { border-radius: 8px; }`;

test("picking a style's options in the popup sets them on the page, and caches them for the next first paint", async ({
  context,
  extension,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, { localhost: { css: CSS, enabled: true } });

  const page = await context.newPage();
  const root = page.locator('html');
  const h1 = page.locator('h1');

  await page.goto(PAGE_URL);
  await expect(root).toHaveAttribute('data-stylebot-accent', 'pink');
  await expect(root).toHaveAttribute('data-stylebot-rounded', '0');
  await expect(h1).toHaveCSS('color', 'rgb(255, 0, 128)');
  await page.bringToFront();

  const popup = await openPopup();
  await waitForEditorListener(popup);

  await popup.locator('[role="group"][aria-label="Accent"] button').click();
  await popup.locator('[role="menuitem"]', { hasText: 'Blue' }).click();
  await popup
    .locator('label', { hasText: 'Rounded corners' })
    .locator('input')
    .click();

  await expect(root).toHaveAttribute('data-stylebot-accent', 'blue');
  await expect(root).toHaveAttribute('data-stylebot-rounded', '1');
  await expect(h1).toHaveCSS('color', 'rgb(0, 0, 255)');
  await expect(h1).toHaveCSS('border-radius', '8px');

  // The cached state is what a reload applies before its first paint.
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('stylebot-cache') ?? '{}').options
      )
    )
    .toEqual({
      accent: { value: 'blue', css: 'rgb(0, 0, 255)' },
      rounded: { value: '1', css: '1' },
    });

  await page.reload();
  await expect(root).toHaveAttribute('data-stylebot-accent', 'blue');
  await expect(h1).toHaveCSS('color', 'rgb(0, 0, 255)');
});
