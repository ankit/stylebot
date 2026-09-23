import { test, expect } from './fixtures';
import {
  startTestServer,
  seedStyles,
  openEditor,
  switchEditorMode,
} from './helpers';

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
  extension,
}) => {
  const host = new URL(server.baseUrl).host;

  await seedStyles(extension, {
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

// Regression: the stale state that gap leaves behind used to be destructive --
// the code editor saved its now-empty css over the style, deleting it.
test('opening the code editor after an SPA navigation does not delete the style', async ({
  context,
  extension,
  openPopup,
}) => {
  test.slow();

  const host = new URL(server.baseUrl).host;
  const styleUrl = `${host}/old`;

  await seedStyles(extension, {
    [styleUrl]: { css: 'h1 { color: rgb(255, 0, 128); }', enabled: true },
  });

  const tabPage = await context.newPage();
  await tabPage.goto(`${server.baseUrl}/old`);
  await expect(tabPage.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  await tabPage.evaluate(() =>
    (window as unknown as { spaNavigate: (p: string) => void }).spaNavigate(
      '/new'
    )
  );
  await tabPage.waitForTimeout(500);

  // A sync pull pushes styles to every open tab exactly like this, clearing
  // the editor's css while its url stays on the old page.
  const optionsPage = await context.newPage();
  await optionsPage.goto(`chrome-extension://${extension.id}/options.html`);
  await optionsPage.evaluate(() => {
    chrome.runtime.sendMessage({ name: 'EnableStyle', url: 'nothing.example' });
  });
  await optionsPage.close();
  await tabPage.bringToFront();

  const editorRoot = await openEditor(tabPage, openPopup);
  await switchEditorMode(editorRoot, 'code');
  await tabPage.waitForTimeout(1000);

  const styles = await extension.evaluate(async () => {
    const items = await chrome.storage.local.get('styles');
    return items['styles'] || {};
  });

  expect(Object.keys(styles)).toContain(styleUrl);
});
