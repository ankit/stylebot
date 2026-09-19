import { test, expect } from './fixtures';
import { startTestServer, seedStyles } from './helpers';

const page = (label: string) => `
  <!doctype html>
  <html>
    <body>
      <h1>${label}</h1>
    </body>
  </html>
`;

let server: { baseUrl: string; close: () => Promise<void> };

test.beforeAll(async () => {
  server = await startTestServer({
    '/a': page('Page A'),
    '/b': page('Page B'),
  });
});

test.afterAll(async () => {
  await server.close();
});

test('applies a host+path-scoped style only on the matching path, and to every tab on that path', async ({
  context,
  extension,
}) => {
  const host = new URL(server.baseUrl).host;

  await seedStyles(extension, {
    [`${host}/a`]: { css: 'h1 { color: rgb(255, 0, 128); }', enabled: true },
  });

  const pageA = await context.newPage();
  await pageA.goto(`${server.baseUrl}/a`);
  await expect(pageA.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  const pageB = await context.newPage();
  await pageB.goto(`${server.baseUrl}/b`);
  await expect(pageB.locator('h1')).not.toHaveCSS('color', 'rgb(255, 0, 128)');

  // Storage-backed, not tab-local: a second tab on the matching path also picks it up.
  const pageA2 = await context.newPage();
  await pageA2.goto(`${server.baseUrl}/a`);
  await expect(pageA2.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
});
