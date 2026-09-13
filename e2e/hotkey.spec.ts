import { test, expect } from './fixtures';

test('opening Stylebot with the keyboard shortcut on-demand injects the editor', async ({
  context,
  extensionId: _extensionId,
}) => {
  const page = await context.newPage();
  await page.goto('https://example.com');
  await page.bringToFront();

  await expect(page.locator('#stylebot')).toHaveCount(0);

  // Default 'stylebot' command combo (src/settings/index.ts) — no editor is
  // present yet, so this must be caught by inject-css's own hotkey listener.
  await page.keyboard.press('Alt+Shift+M');

  await expect(page.locator('#stylebot')).toBeAttached();
});

test('a second shortcut press after the editor is open toggles it exactly once', async ({
  context,
  extensionId: _extensionId,
}) => {
  const page = await context.newPage();
  await page.goto('https://example.com');
  await page.bringToFront();

  await page.keyboard.press('Alt+Shift+M');
  // The panel itself (not just the always-attached #stylebot host) is what
  // v-if's on visible.
  await expect(page.locator('.stylebot-body')).toBeVisible();

  // Once editor/index.js's own hotkeys-js binding is live,
  // __stylebotHotkeysBound tells inject-css's listener to stand down — if
  // it didn't, this single press would be handled by both and net out to
  // "still open" instead of toggling closed.
  await page.keyboard.press('Alt+Shift+M');
  await expect(page.locator('.stylebot-body')).toBeHidden();
});
