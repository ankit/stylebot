import { test, expect } from './fixtures';
import { openEditor } from './helpers';

// Editor-open depends on a popup tab-messaging round trip, which can lag
// under a full parallel worker fleet (see e2e/readability.spec.ts).
test.describe.configure({ retries: 2 });

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <main>
        <p><a href="#">Learn more</a></p>
      </main>
    </body>
  </html>
`;

const FRAME_HTML = `
  <!doctype html>
  <html>
    <body>
      <a id="ad" href="/landing" style="display:block;width:200px;height:100px">
        Get yours now
      </a>
    </body>
  </html>
`;

const PAGE_WITH_FRAME_HTML = `
  <!doctype html>
  <html>
    <body>
      <div class="slot">
        <iframe name="ad" src="/frame" width="240" height="140"></iframe>
      </div>
    </body>
  </html>
`;

test('arrow keys climb and descend ancestors while picking an element', async ({
  context,
  openPopup,
}) => {
  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const editorRoot = await openEditor(page, openPopup);
  const inspectorButton = editorRoot.locator('.stylebot-inspector');
  const selectorChips = editorRoot.locator('.autocomplete-chips .chip');

  const card = page.locator('.inspect-card');
  const currentChips = card.locator('.row').first().locator('.chip');
  const nextAncestorChips = card.locator('.next-row .chip');

  const pageLink = page.getByRole('link', { name: 'Learn more' });

  // openStylebot starts in inspecting mode already.
  await expect(inspectorButton).toHaveClass(/active/);

  // Hovering the link shows its selector and offers its parent as the next
  // step up.
  await pageLink.hover();
  await expect(card).toBeVisible();
  await expect(currentChips.last()).toHaveText(/\ba\s*$/);
  await expect(nextAncestorChips.last()).toHaveText(/\bp\s*$/);

  await page.keyboard.press('ArrowUp');
  await expect(currentChips.last()).toHaveText(/\bp\s*$/);
  await expect(nextAncestorChips.last()).toHaveText(/\bmain\s*$/);

  await page.keyboard.press('ArrowDown');
  await expect(currentChips.last()).toHaveText(/\ba\s*$/);

  // Selecting stops inspecting and applies the climbed-to selector, not the
  // <a>'s.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');

  await expect(inspectorButton).not.toHaveClass(/active/);
  await expect(selectorChips.last()).toHaveText(/\bp\s*$/);

  // Re-enter picking mode and climb to the root: there's nothing above
  // <html>, so the next-ancestor row disappears.
  await inspectorButton.click();
  await expect(inspectorButton).toHaveClass(/active/);

  await pageLink.hover();
  await expect(currentChips.last()).toHaveText(/\ba\s*$/);

  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('ArrowUp');
  }

  await expect(currentChips.last()).toHaveText(/^\s*html\s*$/);
  await expect(nextAncestorChips).toHaveCount(0);

  await page.keyboard.press('Enter');
  await expect(selectorChips.last()).toHaveText(/^\s*html\s*$/);
});

test('clicking an iframe while picking selects it instead of activating its content', async ({
  context,
  openPopup,
}) => {
  await context.route('http://localhost/**', route => {
    const url = new URL(route.request().url());
    const body = url.pathname === '/frame' ? FRAME_HTML : PAGE_WITH_FRAME_HTML;
    route.fulfill({ contentType: 'text/html', body });
  });

  const page = await context.newPage();
  await page.goto('http://localhost/');
  await page.frameLocator('iframe[name="ad"]').locator('#ad').waitFor();

  const editorRoot = await openEditor(page, openPopup);
  const inspectorButton = editorRoot.locator('.stylebot-inspector');
  const selectorChips = editorRoot.locator('.autocomplete-chips .chip');
  const frame = page.locator('iframe[name="ad"]');

  await expect(inspectorButton).toHaveClass(/active/);

  await frame.hover();
  await expect(
    page.locator('.inspect-card .row').first().locator('.chip').last()
  ).toHaveText(/iframe/);

  // The ad link sits under the pointer, inside the frame's own document.
  // force: the shielding overlay is meant to intercept this click, which
  // Playwright's actionability check would otherwise wait out.
  await frame.click({ force: true });

  await expect(inspectorButton).not.toHaveClass(/active/);
  await expect(selectorChips.last()).toHaveText(/iframe/);

  // The frame never navigated: its link's document is still the one we served.
  await expect(
    page.frameLocator('iframe[name="ad"]').locator('#ad')
  ).toBeAttached();
  expect(page.url()).toBe('http://localhost/');
});
