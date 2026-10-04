import { test, expect } from './fixtures';
import { seedStyles, startTestServer } from './helpers';

const PAGE_HTML = `<!doctype html><html><body><h1>Comments</h1></body></html>`;

// The smallest PDF a viewer will open: one empty page.
const PDF = `%PDF-1.1
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj
trailer << /Root 1 0 R >>
%%EOF`;

let baseUrl: string;
let closePageServer: () => Promise<void>;

test.beforeAll(async () => {
  ({ baseUrl, close: closePageServer } = await startTestServer({
    // A web page whose URL ends in .pdf, like a comment page about a PDF.
    '/entry/report.pdf': PAGE_HTML,
    '/report': { body: PDF, headers: { 'Content-Type': 'application/pdf' } },
    '/data': {
      body: '{"hello":"world"}',
      headers: { 'Content-Type': 'application/json' },
    },
  }));
});

test.afterAll(() => closePageServer());

test('styles a web page whose url ends in .pdf, and offers the editor', async ({
  context,
  extension,
  openPopup,
}) => {
  await seedStyles(extension, {
    localhost: { css: 'h1 { color: rgb(255, 0, 0); }', enabled: true },
  });

  const page = await context.newPage();
  await page.goto(`${baseUrl}/entry/report.pdf`);
  await page.bringToFront();

  await expect
    .poll(() => page.locator('h1').evaluate(el => getComputedStyle(el).color))
    .toBe('rgb(255, 0, 0)');

  const popup = await openPopup();

  await expect
    .poll(() => popup.locator('button', { hasText: 'Edit style' }).isVisible())
    .toBe(true);
});

for (const [kind, path] of [
  ['a PDF', '/report'],
  ['a JSON file', '/data'],
]) {
  test(`says Stylebot can't style ${kind}, whatever its url`, async ({
    context,
    openPopup,
  }) => {
    const page = await context.newPage();
    await page.goto(`${baseUrl}${path}`);
    await page.bringToFront();

    const popup = await openPopup();

    await expect
      .poll(() =>
        popup.locator('.unsupported-page', { hasText: 'localhost' }).isVisible()
      )
      .toBe(true);
    expect(
      await popup.locator('button', { hasText: 'Edit style' }).isVisible()
    ).toBe(false);
  });
}
