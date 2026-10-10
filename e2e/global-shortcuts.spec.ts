import { test, expect, type Extension } from './fixtures';
import { PAGE_URL, seedStyles, servePage } from './helpers';

/*
 * Playwright can't press a browser-level shortcut, so these cover the parts
 * around it: the commands the browser registers, the page carrying out one
 * the background hands it, and the background's handler run directly.
 */

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

// The content script answers once it has registered its listener.
const waitForContentScript = (extension: Extension) =>
  expect
    .poll(() =>
      extension
        .evaluate(async url => {
          const tabs = await chrome.tabs.query({});
          const tab = tabs.find(candidate => candidate.url?.startsWith(url));
          const open = await chrome.tabs.sendMessage(tab?.id as number, {
            name: 'GetIsStylebotOpen',
          });
          return typeof open === 'boolean';
        }, PAGE_URL)
        .catch(() => false)
    )
    .toBe(true);

// What the background sends the page when the browser reports a command.
const runCommand = (extension: Extension, command: string) =>
  extension.evaluate(
    async ([url, name]) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find(candidate => candidate.url?.startsWith(url));
      await chrome.tabs.sendMessage(tab?.id as number, {
        name: 'RunCommand',
        command: name,
      });
    },
    [PAGE_URL, command]
  );

// Runs the background's handler as if the browser had caught the shortcut.
const pressShortcut = (extension: Extension, command: string, times = 1) =>
  extension.evaluate(
    async ([url, name, count]) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find(candidate => candidate.url?.startsWith(url));
      const event = chrome.commands.onCommand as unknown as {
        dispatch: (command: string, tab?: chrome.tabs.Tab) => void;
      };

      for (let i = 0; i < count; i++) {
        event.dispatch(name, tab);
      }
    },
    [PAGE_URL, command, times] as const
  );

test('the global shortcuts are registered with the browser, two of them with keys', async ({
  extension,
}) => {
  const commands = await extension.evaluate(async () =>
    Object.fromEntries(
      (
        await chrome.commands.getAll()
      ).map(command => [command.name, Boolean(command.shortcut)])
    )
  );

  expect(commands).toMatchObject({
    stylebot: true,
    style: true,
    readability: false,
    grayscale: false,
  });
});

test('the page toggles the editor when the browser reports the shortcut', async ({
  context,
  extension,
}) => {
  await servePage(context, PAGE_HTML);
  await extension.evaluate(() =>
    chrome.storage.local.set({
      options: {
        layout: { width: 360, adjustPageLayout: false, dockLocation: 'right' },
      },
    })
  );

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  await waitForContentScript(extension);

  await runCommand(extension, 'stylebot');
  await expect(page.locator('#stylebot .stylebot')).toHaveCount(1);

  await runCommand(extension, 'stylebot');
  await expect(page.locator('#stylebot .stylebot')).toHaveCount(0);
});

test('the styling shortcut flips styling once per press, however quickly pressed', async ({
  context,
  extension,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, {
    localhost: { css: 'h1 { color: rgb(255, 0, 128); }', enabled: true },
  });

  const page = await context.newPage();
  await page.goto(PAGE_URL);
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
  await waitForContentScript(extension);

  await pressShortcut(extension, 'style');
  await expect(page.locator('h1')).not.toHaveCSS('color', 'rgb(255, 0, 128)');

  // An even burst must leave styling as it was, so let it settle first.
  await pressShortcut(extension, 'style', 2);
  await page.waitForTimeout(500);
  await expect(page.locator('h1')).not.toHaveCSS('color', 'rgb(255, 0, 128)');

  await pressShortcut(extension, 'style');
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
  await expect(page.locator('#stylebot')).toHaveCount(0);
});
