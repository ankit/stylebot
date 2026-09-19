import { test, expect } from './fixtures';
import { startTestServer, seedStyles } from './helpers';

const page = (label: string) => `
  <!doctype html>
  <html>
    <body>
      <h1>${label}</h1>
      <script>
        // A same-tab SPA navigation. This fires chrome.tabs.onUpdated with
        // status "complete" in the background, same as a real route change.
        window.spaNavigate = path => history.pushState(null, '', path);
      </script>
    </body>
  </html>
`;

let server: { baseUrl: string; close: () => Promise<void> };

test.beforeAll(async () => {
  server = await startTestServer({
    '/old': page('Old page'),
    '/new': page('New page'),
  });
});

test.afterAll(async () => {
  await server.close();
});

// KNOWN GAP, LOCKED IN AS A BASELINE: src/editor/listeners/chrome.ts's TabUpdated
// handler re-derives readability on nav but never re-runs CSS matching/injection.
test('CSS style matching does not re-run on a same-tab SPA navigation (documents a known gap)', async ({
  context,
  runInExtension,
}) => {
  const host = new URL(server.baseUrl).host;

  await seedStyles(runInExtension, {
    [`${host}/old`]: { css: 'h1 { color: rgb(255, 0, 128); }', enabled: true },
    [`${host}/new`]: { css: 'h1 { color: rgb(0, 153, 255); }', enabled: true },
  });

  const tabPage = await context.newPage();
  await tabPage.goto(`${server.baseUrl}/old`);
  await expect(tabPage.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  await tabPage.evaluate(() =>
    (window as unknown as { spaNavigate: (p: string) => void }).spaNavigate(
      '/new'
    )
  );
  // Give the background's chrome.tabs.onUpdated -> TabUpdated round trip a
  // moment to land, so this isn't just "we checked before it could apply".
  await tabPage.waitForTimeout(500);

  await expect(tabPage.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
});
