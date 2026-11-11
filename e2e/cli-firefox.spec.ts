import type { BrowserContext, Page } from '@playwright/test';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { test, expect } from './fixtures';
import { FirefoxEngine } from './firefox/engine';
import type { FirefoxExtension } from './firefox/extension';
import { startTestServer } from './helpers';

/*
 * Drives the real `stylebot` CLI against the Firefox build: CLI → native host
 * → event page → page. Everything the CLI, its host and Firefox write lives
 * in a temporary HOME, so nothing touches ~/.stylebot or your Firefox.
 */

const ROOT = path.resolve(__dirname, '..');
const DIST_PATH = path.join(ROOT, 'firefox-dist');
const CLI_DIR = path.join(ROOT, 'tools', 'cli');

// Where Firefox keeps profiles.ini and reads native hosts from, under HOME, where `stylebot install` looks.
const FIREFOX_DIRS: Record<string, { data: string; hosts: string }> = {
  darwin: {
    data: 'Library/Application Support/Firefox',
    hosts: 'Library/Application Support/Mozilla/NativeMessagingHosts',
  },
  linux: {
    data: '.mozilla/firefox',
    hosts: '.mozilla/native-messaging-hosts',
  },
};

// Short, so the test can wait out an idle event page.
const IDLE_TIMEOUT_MS = 2_000;

const PINK = 'rgb(255, 0, 128)';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head><title>CLI test page</title></head>
    <body style="background: #fff">
      <h1>Styled from the command line</h1>
    </body>
  </html>
`;

const OTHER_PAGE_HTML = `
  <!doctype html>
  <html><head><title>Your page</title></head><body>Yours</body></html>
`;

type CliResult = { code: number; stdout: string; stderr: string };

type Tab = { id: number; windowId: number; active: boolean; url: string };

let home: string;
let env: NodeJS.ProcessEnv;
let context: BrowserContext;
let extension: FirefoxExtension;
let baseUrl: string;
let closeServer: () => Promise<void>;

const cli = (args: Array<string>): Promise<CliResult> =>
  new Promise(resolve =>
    execFile(
      process.execPath,
      [path.join(CLI_DIR, 'lib', 'cli.mjs'), ...args],
      { cwd: home, env },
      (error, stdout, stderr) =>
        resolve({
          code: error ? Number(error.code ?? 1) : 0,
          stdout,
          stderr,
        })
    )
  );

const ok = async (args: Array<string>): Promise<string> => {
  const { code, stdout, stderr } = await cli(args);
  expect(stderr, `stylebot ${args.join(' ')}`).toBe('');
  expect(code).toBe(0);
  return stdout;
};

const json = async <T>(args: Array<string>): Promise<T> =>
  JSON.parse(await ok([...args, '--json'])) as T;

const pngSize = (file: string): { width: number; height: number } => {
  const png = fs.readFileSync(file);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

/**
 * Copies the build with the CLI's optional permission made required, so
 * installing it grants the native host without a prompt.
 */
const copyGrantedBuild = (): string => {
  const dir = path.join(home, 'stylebot');
  fs.cpSync(DIST_PATH, dir, { recursive: true });

  const file = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));

  manifest.permissions = [
    ...manifest.permissions,
    ...manifest.optional_permissions,
  ];
  delete manifest.optional_permissions;
  fs.writeFileSync(file, JSON.stringify(manifest));

  return dir;
};

const tabFor = async (url: string): Promise<Tab> => {
  const tabs = await json<Array<Tab>>(['tabs']);
  const tab = tabs.find(tab => tab.url === url);

  expect(tab, `a tab at ${url}`).toBeDefined();
  return tab!;
};

test.skip(
  process.env.STYLEBOT_BROWSER !== 'firefox' || !FIREFOX_DIRS[process.platform],
  'This spec runs on Firefox, on macOS and Linux'
);

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({}, testInfo) => {
  testInfo.setTimeout(90_000);

  // Short, as macOS caps a socket's path, which the host's is in this HOME, at 103 bytes.
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-ff-'));
  env = { ...process.env, HOME: home };
  delete env.STYLEBOT_SOCKET;

  const dirs = FIREFOX_DIRS[process.platform];
  const firefoxDir = path.join(home, dirs.data);
  const profile = path.join(firefoxDir, 'Profiles', 'test');
  fs.mkdirSync(profile, { recursive: true });
  fs.writeFileSync(path.join(firefoxDir, 'profiles.ini'), '');

  await ok(['install']);

  const engine = new FirefoxEngine({
    'extensions.background.idle.timeout': IDLE_TIMEOUT_MS,
  });

  // The host Firefox starts inherits HOME, so it listens in the test HOME too.
  context = await engine.launch(profile, {
    headless: testInfo.project.use.headless ?? true,
    viewport: null,
    colorScheme: null,
    env,
  });
  extension = (await engine.loadExtension(
    context,
    copyGrantedBuild()
  )) as FirefoxExtension;
  await extension.setNativeManifestsDir(
    path.dirname(path.join(home, dirs.hosts))
  );

  ({ baseUrl, close: closeServer } = await startTestServer({
    '/': PAGE_HTML,
    '/yours': OTHER_PAGE_HTML,
    '/background': PAGE_HTML,
  }));
});

test.afterAll(async () => {
  extension?.close();
  await context?.close();
  await closeServer?.();
  fs.rmSync(home, { recursive: true, force: true });
});

test('install registers the host with Firefox, for its add-on id', async () => {
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(
        home,
        FIREFOX_DIRS[process.platform].hosts,
        'dev.stylebot.cli.json'
      ),
      'utf8'
    )
  );

  expect(manifest.allowed_extensions).toEqual([
    '{52bda3fd-dc48-4b3d-a7b9-58af57879f1e}',
  ]);
});

test('turning the setting on connects the CLI, which names Firefox', async () => {
  await extension.evaluate(async () => {
    const { options } = await chrome.storage.local.get('options');
    await chrome.storage.local.set({
      options: { ...options, cliAccess: true },
    });
  });

  await expect
    .poll(async () => (await cli(['tabs'])).code, { timeout: 15_000 })
    .toBe(0);

  const { stdout } = await cli(['browsers', '--json']);
  expect(stdout).toContain('Firefox');
});

test('css set applies the css to the page', async () => {
  const page: Page = await context.newPage();
  await page.goto(`${baseUrl}/`);

  const file = path.join(home, 'pink.css');
  fs.writeFileSync(file, `h1 { color: ${PINK}; }`);

  const report = await ok(['css', 'set', 'localhost', '--file', file]);

  await expect(page.locator('h1')).toHaveCSS('color', PINK);
  expect(report).toContain('- h1: 1 element');
  expect(
    await ok(['outline', String((await tabFor(`${baseUrl}/`)).id)])
  ).toContain('Styled from the command line');
});

test('screenshot captures a background tab without switching to it', async () => {
  const yours = await context.newPage();
  await yours.goto(`${baseUrl}/yours`);
  await yours.bringToFront();

  // Playwright opens each page in its own window, so the extension opens this one behind yours.
  const backgroundUrl = `${baseUrl}/background`;
  const { windowId } = await tabFor(`${baseUrl}/yours`);
  await extension.evaluate(
    ([url, windowId]) => chrome.tabs.create({ url, windowId, active: false }),
    [backgroundUrl, windowId] as const
  );
  await expect
    .poll(async () => (await json<Array<Tab>>(['tabs'])).map(tab => tab.url))
    .toContain(backgroundUrl);

  const background = await tabFor(backgroundUrl);
  expect(background.active).toBe(false);

  const out = path.join(home, 'shot.png');
  await ok(['screenshot', String(background.id), '-o', out]);

  const viewport = await yours.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
  }));
  expect(pngSize(out)).toEqual(viewport);
  expect((await tabFor(`${baseUrl}/yours`)).active).toBe(true);
  expect((await tabFor(backgroundUrl)).active).toBe(false);
});

test('the CLI stays connected while the event page has nothing else to do', async () => {
  // A DevTools connection to the event page keeps it awake too; without either, it stops.
  extension.close();
  await new Promise(resolve => setTimeout(resolve, IDLE_TIMEOUT_MS * 4));

  expect(
    await ok(['outline', String((await tabFor(`${baseUrl}/`)).id)])
  ).toContain('Styled from the command line');
});
