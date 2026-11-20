import type { Locator, Page } from '@playwright/test';

import { test, expect, type Extension } from './fixtures';
import { PAGE_URL, openEditor, popOutEditor, servePage } from './helpers';

// The second title's id would name it alone, but the field should start on
// every title, as it does after a pick with the inspector.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <ul>
        <li class="story"><a class="title">One</a></li>
        <li class="story"><a class="title" id="second">Two</a></li>
        <li class="story"><a class="title">Three</a></li>
      </ul>
    </body>
  </html>
`;

// The content script answers once it has registered its listeners.
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

// Right-clicks the second title and clicks "Style this element", as the
// background tells the page when the menu item is clicked.
const styleSecondTitle = async (page: Page, extension: Extension) => {
  await page.locator('#second').click({ button: 'right' });
  await extension.evaluate(async url => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find(candidate => candidate.url?.startsWith(url));
    await chrome.tabs.sendMessage(tab?.id as number, {
      name: 'OpenStylebotFromContextMenu',
      sidePanel: false,
    });
  }, PAGE_URL);
};

const expectEveryTitle = async (editorRoot: Locator) => {
  await expect(
    editorRoot.locator('.autocomplete-chips .part').first()
  ).toHaveText(/a\.title$/);
  await expect(editorRoot.locator('.selector-scopes')).toContainText('3');
};

test('"Style this element" starts the selector field on a scope', async ({
  context,
  extension,
}) => {
  await servePage(context, PAGE_HTML);
  const page = await context.newPage();
  await page.goto(PAGE_URL);
  await waitForContentScript(extension);

  await styleSecondTitle(page, extension);

  await expectEveryTitle(page.locator('#stylebot'));
});

test('"Style this element" starts the editor window\'s field on a scope', async ({
  context,
  engine,
  extension,
  openPopup,
}) => {
  test.skip(
    !engine.opensExtensionPages,
    'Playwright cannot attach to extension pages on this engine'
  );

  await servePage(context, PAGE_HTML);
  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);
  const popout = await popOutEditor(context, page, editorRoot);

  await styleSecondTitle(page, extension);

  await expectEveryTitle(popout.locator('.stylebot-app'));
});
