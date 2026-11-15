import { test, expect } from './fixtures';
import { openEditor, startTestServer } from './helpers';

const HOVER_EVENTS = [
  'mouseover',
  'mouseout',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'pointerover',
  'pointerout',
  'pointermove',
  'pointerenter',
  'pointerleave',
];

// A menu that script opens on hover and closes when the pointer leaves.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <nav class="menu open" style="width: 200px; padding: 20px">
        <span class="menu-item">Item</span>
      </nav>
      <p class="other" style="margin-top: 100px">Elsewhere</p>
      <style>
        .grows { font-size: 16px; }
        .grows:hover { font-size: 30px; }
      </style>
      <a class="grows" href="#">Grows on hover</a>
      <script>
        window.hoverEvents = [];
        const menu = document.querySelector('.menu');
        const other = document.querySelector('.other');

        for (const type of ${JSON.stringify(HOVER_EVENTS)}) {
          for (const el of [menu, other]) {
            el.addEventListener(type, () => window.hoverEvents.push(type));
          }
        }

        menu.addEventListener('mouseenter', () => menu.classList.add('open'));
        menu.addEventListener('mouseleave', () => menu.classList.remove('open'));
      </script>
    </body>
  </html>
`;

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({ '/': PAGE_HTML });
});

test.afterAll(() => server.close());

test('inspecting keeps hover events from the page, so its menus hold still', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);

  const editorRoot = await openEditor(page, openPopup);
  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);
  await page.evaluate(() => {
    (window as unknown as { hoverEvents: Array<string> }).hoverEvents = [];
  });

  const item = await page.locator('.menu-item').boundingBox();
  const other = await page.locator('.other').boundingBox();
  await page.mouse.move(item!.x + 5, item!.y + 5, { steps: 5 });
  await page.mouse.move(other!.x + 5, other!.y + 5, { steps: 5 });

  await expect(page.locator('.menu')).toHaveClass(/open/);
  expect(
    await page.evaluate(
      () => (window as unknown as { hoverEvents: Array<string> }).hoverEvents
    )
  ).toEqual([]);

  await page.mouse.click(other!.x + 5, other!.y + 5);

  await expect(
    editorRoot.locator('.autocomplete-chips .part').first()
  ).toHaveText(/\.other$/);
});

test('moving from a hovered element onto the panel reads its styles without :hover', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);

  const editorRoot = await openEditor(page, openPopup);
  const inspector = editorRoot.locator('.stylebot-inspector');
  await expect(inspector).toHaveClass(/active/);

  const size = editorRoot
    .locator('.property-row', { hasText: 'Size' })
    .locator('.number-input');
  const link = await page.locator('.grows').boundingBox();
  await page.mouse.move(link!.x + 5, link!.y + 5, { steps: 5 });
  await expect(size).toHaveAttribute('placeholder', '30');

  const panel = await inspector.boundingBox();
  await page.mouse.move(panel!.x + 5, panel!.y + 5);
  await expect(size).toHaveAttribute('placeholder', '16');
});
