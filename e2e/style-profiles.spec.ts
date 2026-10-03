import type { Locator } from '@playwright/test';

import { test, expect } from './fixtures';
import { PAGE_URL, openEditor, seedStyles, servePage } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

const PINK = 'rgb(255, 0, 128)';
const BLUE = 'rgb(0, 0, 255)';

const switcher = (editor: Locator) =>
  editor.getByRole('button', { name: 'Switch profile' });

const TWO_PROFILES = {
  css: `h1 { color: ${PINK}; }`,
  enabled: true,
  profiles: {
    default: { name: '' },
    dark: { name: 'Dark', css: `h1 { color: ${BLUE}; }` },
  },
  activeProfile: 'default',
};

test('the active profile is what the page gets, on first and repeat visits', async ({
  context,
  extension,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, {
    localhost: {
      css: `h1 { color: ${BLUE}; }`,
      enabled: true,
      profiles: {
        default: { name: '', css: `h1 { color: ${PINK}; }` },
        dark: { name: 'Dark' },
      },
      activeProfile: 'dark',
    },
  });

  const page = await context.newPage();

  for (const visit of [() => page.goto(PAGE_URL), () => page.reload()]) {
    await visit();
    await expect(page.locator('h1')).toHaveCSS('color', BLUE);
  }
});

test('switching profiles from the editor header restyles the page, and a new profile starts blank', async ({
  context,
  extension,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, { localhost: TWO_PROFILES });

  const page = await context.newPage();
  await page.goto(PAGE_URL);
  await expect(page.locator('h1')).toHaveCSS('color', PINK);

  const editor = await openEditor(page, openPopup);

  await switcher(editor).click();
  await editor.getByRole('menuitem', { name: 'Dark' }).click();
  await expect(page.locator('h1')).toHaveCSS('color', BLUE);
  await expect(switcher(editor)).toHaveText('Dark');

  await switcher(editor).click();
  await editor.getByRole('menuitem', { name: 'Create profile' }).click();
  await editor.getByRole('textbox', { name: 'Profile name' }).fill('Plain');
  await editor.getByRole('textbox', { name: 'Profile name' }).press('Enter');

  await expect(switcher(editor)).toHaveText('Plain');
  await expect(page.locator('h1')).not.toHaveCSS('color', BLUE);
  await expect(page.locator('h1')).not.toHaveCSS('color', PINK);

  const stored = await extension.evaluate(async () => {
    const { styles } = await chrome.storage.local.get('styles');
    return styles.localhost;
  });
  // chrome.storage keeps object keys sorted, so compare names as a set.
  expect(
    Object.values(stored.profiles)
      .map(p => (p as { name: string }).name)
      .sort()
  ).toEqual(['', 'Dark', 'Plain']);
  expect(stored.profiles.dark.css).toBe(`h1 { color: ${BLUE}; }`);
});

test('after switching profiles in the editor, a reload paints the new profile from its first frame', async ({
  context,
  extension,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, { localhost: TWO_PROFILES });

  const page = await context.newPage();
  await page.goto(PAGE_URL);
  const editor = await openEditor(page, openPopup);

  await switcher(editor).click();
  await editor.getByRole('menuitem', { name: 'Dark' }).click();
  await expect(page.locator('h1')).toHaveCSS('color', BLUE);

  // The cache is what a reload applies before storage answers.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('stylebot-cache')))
    .toContain('rgb(0, 0, 255)');

  await page.reload();
  await expect(page.locator('h1')).toHaveCSS('color', BLUE);
});

test('a switch sent the way the popup does restyles every tab and the open editor', async ({
  context,
  extension,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, { localhost: TWO_PROFILES });

  const other = await context.newPage();
  await other.goto(PAGE_URL);

  const page = await context.newPage();
  await page.goto(PAGE_URL);
  const editor = await openEditor(page, openPopup);
  await expect(switcher(editor)).toHaveText('Default');

  // As in style-cross-tab-toggle: the harness popup is a tab, so send the
  // message its picker sends rather than clicking it.
  const popup = await openPopup();
  await popup.evaluate(() => {
    chrome.runtime.sendMessage({
      name: 'SetActiveProfile',
      url: 'localhost',
      profileId: 'dark',
    });
  });

  await expect(page.locator('h1')).toHaveCSS('color', BLUE);
  await expect(other.locator('h1')).toHaveCSS('color', BLUE);
  await expect(switcher(editor)).toHaveText('Dark');
});
