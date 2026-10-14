import { test, expect } from './fixtures';
import { PAGE_URL, servePage } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

test.skip(
  ({ engine }) => !engine.opensExtensionPages,
  'Stops the background through an extension page, over CDP'
);

test("a message the background doesn't answer leaves no error in the page when the background stops", async ({
  context,
  extension,
}) => {
  await servePage(context, PAGE_HTML);

  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  const errors: Array<string> = [];
  const contentScriptContexts: Array<number> = [];

  session.on('Runtime.exceptionThrown', ({ exceptionDetails }) =>
    errors.push(exceptionDetails.exception?.description ?? '')
  );
  session.on('Runtime.executionContextCreated', ({ context: created }) => {
    if (created.name === 'Stylebot') {
      contentScriptContexts.push(created.id);
    }
  });
  await session.send('Runtime.enable');
  await page.goto(PAGE_URL);
  await expect.poll(() => contentScriptContexts.length).toBeGreaterThan(0);

  // What the editor sends as the user changes an option, without awaiting.
  await session.send('Runtime.evaluate', {
    contextId: contentScriptContexts[0],
    expression: `chrome.runtime.sendMessage({
      name: 'SetOption',
      option: { name: 'contextMenu', value: true },
    }); undefined`,
  });

  const extensionPage = await context.newPage();
  await extensionPage.goto(`chrome-extension://${extension.id}/options.html`);
  const extensionSession = await context.newCDPSession(extensionPage);
  await extensionSession.send('ServiceWorker.enable');
  await extensionSession.send('ServiceWorker.stopAllWorkers');
  await extensionPage.close();
  await page.waitForTimeout(1000);

  expect(errors).toEqual([]);
});
