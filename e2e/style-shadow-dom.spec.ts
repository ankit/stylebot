import { test, expect } from './fixtures';
import {
  openEditor,
  pickElement,
  seedStyles,
  startTestServer,
} from './helpers';

// Three ways a page ends up with shadow roots: attached by an inline script,
// upgraded from parsed markup once a late component definition runs, and
// nested inside another root. Each root's own CSS colors its text red. The
// padded host leaves room to point at the host itself before its content.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <div id="plain"></div>
      <div id="padded" style="padding: 40px"></div>
      <late-card></late-card>
      <script>
        const ownCss = '<style>p { color: rgb(255, 0, 0); }</style>';

        document.getElementById('plain').attachShadow({ mode: 'open' })
          .innerHTML = ownCss + '<p class="plain-text">Plain</p>';
        document.getElementById('padded').attachShadow({ mode: 'open' })
          .innerHTML = '<span class="padded-text">Padded</span>';

        setTimeout(() => {
          customElements.define('late-card', class extends HTMLElement {
            constructor() {
              super();
              const root = this.attachShadow({ mode: 'open' });
              root.innerHTML = ownCss +
                '<p class="late-text">Late</p><div class="nested"></div>';
              root.querySelector('.nested').attachShadow({ mode: 'open' })
                .innerHTML = ownCss + '<p class="nested-text">Nested</p>';
            }
          });
        }, 500);
      </script>
    </body>
  </html>
`;

const IMPORTED_CSS = 'p { text-decoration-line: underline; }';

const TEXT = ['.plain-text', '.late-text', '.nested-text'];

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({
    '/': PAGE_HTML,
    '/imported.css': {
      body: IMPORTED_CSS,
      headers: {
        'Content-Type': 'text/css',
        'Access-Control-Allow-Origin': '*',
      },
    },
  });
});

test.afterAll(() => server.close());

test('a style and its @import reach every open shadow root, and turn off with the style', async ({
  context,
  extension,
  openPopup,
}) => {
  await seedStyles(extension, {
    localhost: {
      css: `@import url("${server.baseUrl}/imported.css");
p { color: rgb(0, 0, 255); }`,
      enabled: true,
    },
  });

  const page = await context.newPage();

  for (const visit of [() => page.goto(server.baseUrl), () => page.reload()]) {
    await visit();

    for (const text of TEXT) {
      await expect(page.locator(text)).toHaveCSS('color', 'rgb(0, 0, 255)');
      await expect(page.locator(text)).toHaveCSS(
        'text-decoration-line',
        'underline'
      );
    }
  }

  const popup = await openPopup();
  await popup.evaluate(() => {
    chrome.runtime.sendMessage({ name: 'DisableStyle', url: 'localhost' });
  });

  for (const text of TEXT) {
    await expect(page.locator(text)).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(page.locator(text)).toHaveCSS('text-decoration-line', 'none');
  }
});

test('an element inside a shadow root can be picked and styled in the editor', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);
  await expect(page.locator('.nested-text')).toBeVisible();

  const editorRoot = await openEditor(page, openPopup);
  await pickElement(page, editorRoot, '.nested-text');

  await editorRoot
    .locator('.selector-autocomplete .autocomplete-chips')
    .click();
  await expect(
    editorRoot.locator('.css-selector-dropdown-item.current .item-count')
  ).toHaveText('1');
  await page.keyboard.press('Escape');

  const colorInput = editorRoot.locator('.color-picker .color-hex').first();
  await colorInput.fill('#ff0080');
  await colorInput.blur();

  await expect(page.locator('.nested-text')).toHaveCSS(
    'color',
    'rgb(255, 0, 128)'
  );
  await expect(page.locator('.plain-text')).toHaveCSS(
    'color',
    'rgb(255, 0, 0)'
  );
});

test('the inspector follows the pointer from a shadow host onto its content', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);

  const editorRoot = await openEditor(page, openPopup);
  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);

  const host = (await page.locator('#padded').boundingBox())!;
  const text = (await page.locator('.padded-text').boundingBox())!;

  await page.mouse.move(host.x + 10, host.y + 10);
  await page.mouse.move(text.x + text.width / 2, text.y + text.height / 2);
  await page.mouse.down();
  await page.mouse.up();

  await expect(
    editorRoot.locator('.autocomplete-chips .part').first()
  ).toHaveText(/\.padded-text$/);
});
