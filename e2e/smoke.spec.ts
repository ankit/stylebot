import { test, expect, skipWithoutPopup } from './fixtures';
import { startTestServer } from './helpers';

skipWithoutPopup();

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

let baseUrl: string;
let closePageServer: () => Promise<void>;

test.beforeAll(async () => {
  ({ baseUrl, close: closePageServer } = await startTestServer({
    '/': PAGE_HTML,
  }));
});

test.afterAll(() => closePageServer());

test('popup mounts and renders the open-editor toggle', async ({
  context,
  openPopup,
}) => {
  // A real page must be the active tab first — otherwise the popup's own
  // chrome-extension:// tab becomes "the current tab" and it renders the
  // restricted-page state instead of the toggle.
  const page = await context.newPage();
  await page.goto(baseUrl);
  await page.bringToFront();

  const popup = await openPopup();

  // Proves the popup's Vue app mounts without throwing — the direct symptom
  // of the "won't open" bug cluster is a blank or broken popup here.
  await expect(
    popup.getByRole('button', { name: /^Style this page/ })
  ).toBeVisible();
});
