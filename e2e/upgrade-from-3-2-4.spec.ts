import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { BrowserContext, Route } from '@playwright/test';
import type { Engine } from './engine';
import { test, expect, type Extension } from './fixtures';
import { startTestServer } from './helpers';

const RELEASE = '3.2.4';
// The build under test may still carry the old version number until release.
const NEXT_VERSION = '4.0.0';
const RELEASE_URL = `https://github.com/ankit/stylebot/releases/download/v${RELEASE}/stylebot-${RELEASE}.zip`;
const CACHE_DIR = path.resolve(__dirname, '.cache');
const DIST_PATH = path.resolve(__dirname, '..', 'dist');

const PAGE_HTML = `<!doctype html><html><body><h1>Test page</h1></body></html>`;

const LAST_SYNCED_AT = '2026-09-02T09:00:00.000Z';
const REMOTE_CHANGED_AT = '2026-09-03T09:00:00.000Z';

const stylesFrom324 = {
  localhost: {
    css: 'h1 { color: rgb(0, 128, 0); }',
    enabled: true,
    readability: false,
    modifiedTime: '2026-09-01T10:00:00.000+02:00',
  },
  'news.example.org': {
    css: '',
    enabled: false,
    readability: true,
    modifiedTime: '2026-09-02T10:00:00.000+02:00',
  },
};

/*
 * Drive's copy after another device synced: a style added there, and none of
 * the style this device made since its own last sync.
 */
const remoteStyles = {
  localhost: stylesFrom324.localhost,
  'other.example': {
    css: 'body { margin: 0; }',
    enabled: true,
    readability: false,
    modifiedTime: '2026-09-03T08:00:00.000Z',
  },
};

/**
 * Storage as 3.2.4 leaves it on a profile that synced and changed settings:
 * the metadata as 3.2.4 writes it, settings 4.0 renamed or retired, and the
 * sync file's metadata under its old key.
 */
const storageFrom324 = {
  styles: stylesFrom324,
  'styles-metadata': { modifiedTime: '2026-09-02T10:00:00.000+02:00' },
  options: {
    contextMenu: false,
    fonts: ['Georgia', 'Lora'],
    layout: { width: 420, adjustPageLayout: true, dockLocation: 'left' },
    mode: 'code',
    basicModeSections: {
      text: true,
      colors: false,
      layout: false,
      border: true,
    },
    colorPalette: 'material',
  },
  'google-drive-sync-enabled': true,
  'google-drive-sync': { id: 'drive-file', modifiedTime: LAST_SYNCED_AT },
};

/**
 * The shipped 3.2.4 zip, downloaded once into a gitignored cache.
 */
const getReleaseZip = async (): Promise<string> => {
  const zip = path.join(CACHE_DIR, `stylebot-${RELEASE}.zip`);

  if (!fs.existsSync(zip)) {
    const response = await fetch(RELEASE_URL);
    if (!response.ok) {
      throw new Error(`Could not download ${RELEASE_URL}: ${response.status}`);
    }

    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(`${zip}.part`, Buffer.from(await response.arrayBuffer()));
    fs.renameSync(`${zip}.part`, zip);
  }

  return zip;
};

const stampVersion = (dir: string, version: string): void => {
  const file = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, JSON.stringify({ ...manifest, version }));
};

/**
 * The styles in a multipart Drive upload: the part that parses as JSON and
 * isn't the file's own metadata.
 */
const uploadedStyles = (body: string): Record<string, unknown> | undefined =>
  body
    .split(/\r\n--/)
    .map(part => part.split('\r\n\r\n').slice(1).join('\r\n\r\n'))
    .map(content => {
      try {
        return JSON.parse(content);
      } catch {
        return undefined;
      }
    })
    .find(json => json && typeof json === 'object' && 'localhost' in json);

/**
 * Answers the Drive calls a sync makes for a file another device changed,
 * and records every upload.
 */
const mockDrive = (
  context: BrowserContext,
  uploads: Array<Record<string, unknown> | undefined>
) => {
  const metadata = (modifiedTime: string) => ({
    id: 'drive-file',
    modifiedTime,
    webViewLink: 'https://drive.google.com/view',
    webContentLink: 'https://drive.google.com/download',
  });

  const handle = (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname.startsWith('/upload/')) {
      uploads.push(uploadedStyles(request.postDataBuffer()?.toString() ?? ''));
      return route.fulfill({ json: metadata(new Date().toISOString()) });
    }

    if (url.pathname === '/drive/v3/about') {
      return route.fulfill({
        json: { user: { emailAddress: 'a@example.com' } },
      });
    }

    if (url.pathname === '/drive/v3/files/drive-file') {
      return url.searchParams.get('alt') === 'media'
        ? route.fulfill({ json: remoteStyles })
        : route.fulfill({ json: metadata(REMOTE_CHANGED_AT) });
    }

    if (url.pathname === '/drive/v3/files') {
      const query = url.searchParams.get('q') ?? '';
      return query.includes('mimeType')
        ? route.fulfill({ json: { files: [{ id: 'folder' }] } })
        : route.fulfill({
            json: {
              files: [{ id: 'drive-file', modifiedTime: REMOTE_CHANGED_AT }],
            },
          });
    }

    return route.fulfill({ status: 404, json: {} });
  };

  return context.route('https://www.googleapis.com/**', handle);
};

/**
 * Waits for the background of the given version to answer, as the previous
 * one's worker may still be listed for a moment after a reload.
 */
const waitForVersion = (extension: Extension, version: string) =>
  expect
    .poll(
      () =>
        extension
          .evaluate(() => chrome.runtime.getManifest().version)
          .catch(() => ''),
      { timeout: 30_000 }
    )
    .toBe(version);

/**
 * Copies the current build over the release's folder with a newer version,
 * and loads it again, which reloads it from disk as an update, keeping its
 * id and storage.
 */
const updateToBuild = async (
  engine: Engine,
  context: BrowserContext,
  extensionDir: string,
  old: Extension
): Promise<Extension> => {
  fs.rmSync(extensionDir, { recursive: true, force: true });
  fs.cpSync(DIST_PATH, extensionDir, { recursive: true });
  stampVersion(extensionDir, NEXT_VERSION);

  const upgraded = await engine.loadExtension(context, extensionDir);
  expect(upgraded.id).toBe(old.id);
  await waitForVersion(upgraded, NEXT_VERSION);
  return upgraded;
};

test('upgrading from 3.2.4 keeps styles and settings, and syncs without dropping a style', async ({
  engine,
}, testInfo) => {
  test.skip(
    process.env.STYLEBOT_BROWSER === 'firefox',
    `The ${RELEASE} release zip is the Chrome and Edge build`
  );
  test.setTimeout(120_000);

  const zip = await getReleaseZip();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-upgrade-'));
  const extensionDir = path.join(root, 'extension');
  execFileSync('unzip', ['-q', zip, '-d', extensionDir]);

  const server = await startTestServer({ '/': PAGE_HTML });
  const uploads: Array<Record<string, unknown> | undefined> = [];
  const context = await engine.launch(path.join(root, 'profile'), {
    headless: testInfo.project.use.headless ?? true,
    viewport: null,
    colorScheme: null,
  });

  try {
    await context.route('https://stylebot.dev/**', route =>
      route.fulfill({ contentType: 'text/html', body: '' })
    );
    await mockDrive(context, uploads);

    const old = await engine.loadExtension(context, extensionDir);

    await test.step(`${RELEASE} applies the seeded styles`, async () => {
      await waitForVersion(old, RELEASE);
      await old.evaluate(items => chrome.storage.local.set(items), {
        ...storageFrom324,
        // Unknown to 3.2.4, so it is kept for the new version's first sync.
        'google-drive-access-token': {
          token: 'test-token',
          expiresAt: Date.now() + 3_600_000,
        },
      });

      const page = await context.newPage();
      await page.goto(server.baseUrl);
      await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 128, 0)');
      await page.close();
    });

    const extension =
      await test.step('swap in the new build at the same path', () =>
        updateToBuild(engine, context, extensionDir, old));

    await test.step('the migrations finish cleanly', async () => {
      await expect
        .poll(() =>
          extension.evaluate(async () => {
            const items = await chrome.storage.local.get([
              'migration_sync_storage_update_complete',
              'migration_errors',
              'google-drive-sync-state',
            ]);
            return {
              done: items.migration_sync_storage_update_complete ?? false,
              errors: items.migration_errors ?? null,
              lastSyncedAt: items['google-drive-sync-state']?.lastSyncedAt,
            };
          })
        )
        .toEqual({ done: true, errors: null, lastSyncedAt: LAST_SYNCED_AT });
    });

    await test.step('the settings are kept, and the retired ones dropped', async () => {
      const {
        basicModeSections: _basicModeSections,
        colorPalette: _colorPalette,
        ...kept
      } = storageFrom324.options;

      await expect
        .poll(() =>
          extension.evaluate(async () => {
            const items = await chrome.storage.local.get('options');
            return items.options;
          })
        )
        .toEqual(kept);
    });

    await test.step('the styles are kept and applied', async () => {
      const styles = await extension.evaluate(async () => {
        const items = await chrome.storage.local.get('styles');
        return items.styles;
      });
      expect(Object.keys(styles).sort()).toEqual(
        Object.keys(stylesFrom324).sort()
      );
      expect(styles.localhost.css).toBe(stylesFrom324.localhost.css);

      const page = await context.newPage();
      await page.goto(server.baseUrl);
      await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 128, 0)');
      await page.close();
    });

    await test.step('the first sync merges in the other device’s style and drops none', async () => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extension.id}/options.html`);
      const response = await page.evaluate(() =>
        chrome.runtime.sendMessage({ name: 'RunGoogleDriveSync' })
      );
      expect(response).toMatchObject({ ok: true });

      const expected = [...Object.keys(stylesFrom324), 'other.example'].sort();
      expect(uploads.length).toBeGreaterThan(0);
      for (const upload of uploads) {
        expect(Object.keys(upload ?? {}).sort()).toEqual(expected);
      }

      const local = await extension.evaluate(async () => {
        const items = await chrome.storage.local.get('styles');
        return Object.keys(items.styles).sort();
      });
      expect(local).toEqual(expected);
    });
  } finally {
    await context.close().catch(() => {});
    await server.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('updating from 3.2.4 brings Stylebot back to a tab left open with the editor showing, without reloading it', async ({
  engine,
}, testInfo) => {
  test.skip(
    process.env.STYLEBOT_BROWSER === 'firefox',
    `The ${RELEASE} release zip is the Chrome and Edge build`
  );
  test.setTimeout(120_000);

  const zip = await getReleaseZip();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-update-'));
  const extensionDir = path.join(root, 'extension');
  execFileSync('unzip', ['-q', zip, '-d', extensionDir]);

  const server = await startTestServer({ '/': PAGE_HTML });
  const context = await engine.launch(path.join(root, 'profile'), {
    headless: testInfo.project.use.headless ?? true,
    viewport: null,
    colorScheme: null,
  });

  try {
    await context.route('https://stylebot.dev/**', route =>
      route.fulfill({ contentType: 'text/html', body: '' })
    );

    const old = await engine.loadExtension(context, extensionDir);
    await waitForVersion(old, RELEASE);
    await old.evaluate(styles => chrome.storage.local.set({ styles }), {
      localhost: stylesFrom324.localhost,
    });

    const page = await context.newPage();
    await page.goto(server.baseUrl);
    await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 128, 0)');

    const editorRoot = page.locator('#stylebot');
    // Its overlay is an unnamed div on the body, drawn while inspecting.
    const oldOverlays = page.locator('body > div:not([id])');

    await test.step(`open the ${RELEASE} editor, inspecting`, async () => {
      // Sent until the page's listener is up to hear it.
      await expect(async () => {
        await old.evaluate(async () => {
          const [tab] = await chrome.tabs.query({ url: 'http://localhost/*' });
          await chrome.tabs.sendMessage(tab.id!, { name: 'OpenStylebot' });
        });
        await expect(editorRoot.locator('.stylebot')).toBeVisible({
          timeout: 1000,
        });
      }).toPass();
      await page.locator('h1').hover();
      await expect(oldOverlays).not.toHaveCount(0);
      await page.mouse.move(0, 0);
    });

    const extension = await updateToBuild(engine, context, extensionDir, old);
    const openPopup = () => engine.openPopup(context, extension);

    await test.step("the new editor takes the old one's place", async () => {
      await expect(editorRoot.locator('.stylebot-content')).toBeVisible();
      await expect(editorRoot).toHaveCount(1);
    });

    await test.step(`the ${RELEASE} inspector stops`, async () => {
      await expect(oldOverlays).toHaveCount(0);
      await page.locator('h1').hover();
      await page.mouse.move(0, 0);
      await expect(oldOverlays).toHaveCount(0);
    });

    await test.step('the page answers the new version', async () => {
      await expect
        .poll(() =>
          extension.evaluate(async () => {
            const [tab] = await chrome.tabs.query({
              url: 'http://localhost/*',
            });
            return chrome.tabs
              .sendMessage(tab.id!, { name: 'GetCanStylePage' })
              .catch(() => undefined);
          })
        )
        .toBe(true);
    });

    await test.step('style changes still reach the page', async () => {
      const popup = await openPopup();
      // Not awaited: the background never answers these.
      await popup.evaluate(() => {
        chrome.runtime.sendMessage({ name: 'DisableStyle', url: 'localhost' });
      });
      await expect(page.locator('h1')).not.toHaveCSS('color', 'rgb(0, 128, 0)');

      await popup.evaluate(() => {
        chrome.runtime.sendMessage({ name: 'EnableStyle', url: 'localhost' });
      });
      await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 128, 0)');
      await popup.close();
    });
  } finally {
    await context.close().catch(() => {});
    await server.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
