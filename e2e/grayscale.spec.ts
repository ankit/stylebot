import { test, expect } from './fixtures';
import {
  PAGE_URL,
  runCommand,
  seedStyles,
  servePage,
  waitForContentScript,
} from './helpers';

// The filter effect attaches to body's element children, so the styled element
// has to be one of them for grayscale to land on the user's own rule.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <div class="article-body">Test page</div>
    </body>
  </html>
`;

// Hacker News wraps its page in a bare <center>, giving the filter no class or
// id to hang off.
const UNIDENTIFIED_PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <center><table id="hnmain"><tr><td>Test page</td></tr></table></center>
    </body>
  </html>
`;

// Proves the grayscale command's filter lands on the live page and that
// taking it off keeps the rest of the rule, live and after a reload.
test('taking grayscale back off keeps the rest of the rule in the saved style', async ({
  context,
  extension,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, {
    localhost: { css: 'div.article-body { color: #ff0080; }', enabled: true },
  });

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const article = page.locator('div.article-body');
  await expect(article).toHaveCSS('color', 'rgb(255, 0, 128)');
  await waitForContentScript(extension);

  await runCommand(extension, 'grayscale');
  await expect(article).toHaveCSS('filter', 'grayscale(1)');

  await runCommand(extension, 'grayscale');
  await expect(article).toHaveCSS('filter', 'none');

  // The colour has to outlive the filter both live and in the persisted style.
  await expect(article).toHaveCSS('color', 'rgb(255, 0, 128)');

  await page.reload();
  await expect(article).toHaveCSS('color', 'rgb(255, 0, 128)');
  await expect(article).toHaveCSS('filter', 'none');
});

test('grayscale applies on a page whose body child has no class or id', async ({
  context,
  extension,
}) => {
  await servePage(context, UNIDENTIFIED_PAGE_HTML);

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const wrapper = page.locator('center');
  await waitForContentScript(extension);

  await runCommand(extension, 'grayscale');
  await expect(wrapper).toHaveCSS('filter', 'grayscale(1)');

  await runCommand(extension, 'grayscale');
  await expect(wrapper).toHaveCSS('filter', 'none');
});
