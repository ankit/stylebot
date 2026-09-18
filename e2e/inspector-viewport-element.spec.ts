import { test, expect } from './fixtures';
import { openEditor, startTestServer } from './helpers';

test('picking a viewport-sized element highlights it like any other', async ({
  context,
  openPopup,
}) => {
  const server = await startTestServer({
    '/': `<!doctype html><html><body style="margin:0">
      <main id="big" style="min-height:200vh;width:100%"><p>content</p></main>
    </body></html>`,
  });

  try {
    const page = await context.newPage();
    await page.goto(server.baseUrl);
    await openEditor(page, openPopup);

    // Opening from the popup starts in picking mode.
    await expect(page.locator('.stylebot-inspector')).toHaveClass(/active/);
    await page.locator('#big').hover({ position: { x: 300, y: 400 } });

    const content = page.locator('#stylebot-overlay > div > div > div > div');
    await expect(content).toHaveCount(1);
    await expect(content).toHaveCSS(
      'background-color',
      'rgba(120, 170, 210, 0.7)'
    );
    const box = await content.boundingBox();
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(box?.height).toBeGreaterThan(viewportHeight);
  } finally {
    await server.close();
  }
});
