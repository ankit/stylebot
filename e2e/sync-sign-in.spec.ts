import type { Page } from '@playwright/test';
import { test, expect, type Extension } from './fixtures';

type SignIn = { state: string; status: string };

const readSignIn = (page: Page): Promise<SignIn | null> =>
  page.evaluate(async () => {
    const items = await chrome.storage.local.get('google-drive-sign-in');
    return items['google-drive-sign-in']?.[0] ?? null;
  });

/**
 * Starts an interactive sync with no refresh token from the options page,
 * which opens Google's consent page in a tab, and returns the sign-in it
 * recorded.
 */
const startSignIn = async (
  page: Page,
  extension: Extension
): Promise<SignIn> => {
  await page.goto(`chrome-extension://${extension.id}/options.html`);
  await page.evaluate(() =>
    chrome.storage.local.set({ 'google-drive-sync-enabled': true })
  );

  page
    .evaluate(() =>
      chrome.runtime.sendMessage({
        name: 'RunGoogleDriveSync',
        interactive: true,
      })
    )
    .catch(() => undefined);

  await expect.poll(() => readSignIn(page)).not.toBeNull();
  return (await readSignIn(page)) as SignIn;
};

/**
 * Lands a tab where Google sends the browser back after consent, keeping the
 * urls it went through. The code is made up, so exchanging it fails, which
 * still finishes the sign-in.
 */
const returnFromGoogle = async (
  page: Page,
  state: string
): Promise<{ landing: Page; navigations: Array<string> }> => {
  const landing = await page.context().newPage();
  const navigations: Array<string> = [];

  landing.on('framenavigated', frame => navigations.push(frame.url()));
  await landing
    .goto(`http://127.0.0.1/stylebot-auth?code=made-up&state=${state}`)
    .catch(() => undefined);

  return { landing, navigations };
};

test.describe('Google Drive sign-in in a tab', () => {
  test.skip(
    ({ engine }) => !engine.opensExtensionPages,
    'Firefox signs in through its auth window instead'
  );

  test('sends Google back to the extension, which finishes the sign-in and closes the tab', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();
    const { state } = await startSignIn(page, extension);

    const { landing, navigations } = await returnFromGoogle(page, state);

    await expect
      .poll(async () => (await readSignIn(page))?.status)
      .toBe('failed');
    expect(navigations).toContain(
      `chrome-extension://${extension.id}/google-sign-in/index.html?code=made-up&state=${state}`
    );
    await expect.poll(() => landing.isClosed()).toBe(true);
  });

  test('finishes the sign-in from the loopback address when the redirect rule did not run', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();
    const { state } = await startSignIn(page, extension);
    await page.evaluate(() =>
      chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1] })
    );

    const { landing } = await returnFromGoogle(page, state);

    await expect
      .poll(async () => (await readSignIn(page))?.status)
      .toBe('failed');
    await expect.poll(() => landing.isClosed()).toBe(true);
  });
});
