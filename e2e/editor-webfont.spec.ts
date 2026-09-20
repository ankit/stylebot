import type { BrowserContext, Page } from '@playwright/test';
import { test, expect, type Popup } from './fixtures';
import { openEditor, pickElement, startTestServer } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

const FONT_CSS = `
  @font-face {
    font-family: 'Montserrat';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/montserrat/test.woff2) format('woff2');
  }
`;

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({
    '/': {
      body: PAGE_HTML,
      headers: {
        // The kind of policy that makes a font lookup from the content script
        // silently fail on Firefox (see #754).
        'Content-Security-Policy':
          "default-src 'self'; style-src 'self' 'unsafe-inline'",
      },
    },
  });
});

test.afterAll(() => server.close());

type FontRequest = { url: string; fromServiceWorker: boolean };

// Serves FONT_CSS for the family and records who asked for it. On Firefox the
// background's requests aren't observable, so the lookup goes to the real
// Google Fonts and nothing is recorded.
const interceptFontLookups = async (
  context: BrowserContext
): Promise<Array<FontRequest>> => {
  const fontRequests: Array<FontRequest> = [];

  await context.route('https://fonts.googleapis.com/**', route => {
    const request = route.request();

    if (request.url().includes('family=Montserrat')) {
      fontRequests.push({
        url: request.url(),
        fromServiceWorker: !!request.serviceWorker(),
      });
    }

    return route.fulfill({ contentType: 'text/css', body: FONT_CSS });
  });

  return fontRequests;
};

const selectMontserrat = async (
  page: Page,
  openPopup: () => Promise<Popup>
): Promise<void> => {
  const editorRoot = await openEditor(page, openPopup);
  await pickElement(page, editorRoot, 'h1');

  // A freshly picked element with no existing declarations auto-expands the
  // Text panel, which hosts the font-family picker (see TheTextProperties.vue).
  // page-scoped, not editorRoot-scoped: see e2e/color-picker.spec.ts.
  const textCard = page.locator('.property-card').filter({
    has: page.locator('.property-card-label', { hasText: /^Text$/ }),
  });
  await textCard
    .locator('.font-family-autocomplete .autocomplete-chevron')
    .click();
  await page.getByRole('menuitem', { name: /^Montserrat/ }).click();
};

test('selecting a font inlines its @font-face despite the page CSP', async ({
  context,
  openPopup,
}) => {
  await interceptFontLookups(context);

  const page = await context.newPage();
  await page.goto(server.baseUrl);

  await selectMontserrat(page, openPopup);

  await expect(page.locator('h1')).toHaveCSS('font-family', 'Montserrat');

  const stylesheet = page.locator('style[id^="stylebot-css-"]').first();
  await expect.poll(() => stylesheet.textContent()).toContain('@font-face');
  await expect.poll(() => stylesheet.textContent()).toContain('Montserrat');
});

test('every font lookup comes from the background, not the page', async ({
  context,
  engine,
  openPopup,
}) => {
  test.skip(
    !engine.routesExtensionRequests,
    "Playwright can't observe the extension's own requests on this engine"
  );

  const fontRequests = await interceptFontLookups(context);

  const page = await context.newPage();
  await page.goto(server.baseUrl);

  await selectMontserrat(page, openPopup);
  await expect(page.locator('h1')).toHaveCSS('font-family', 'Montserrat');

  expect(fontRequests.length).toBeGreaterThan(0);
  expect(fontRequests.every(request => request.fromServiceWorker)).toBe(true);
});
