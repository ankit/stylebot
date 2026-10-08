import type { BrowserContext, Page } from '@playwright/test';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ChromiumEngine } from './chromium/engine';
import { test, expect } from './fixtures';
import { startTestServer } from './helpers';

/*
 * Drives the real `stylebot` CLI against the built extension: CLI → native
 * host → background → page. Everything the CLI and its host write lives in a
 * temporary HOME, so nothing touches ~/.stylebot or your browsers.
 */

const ROOT = path.resolve(__dirname, '..');
const DIST_PATH = path.join(ROOT, 'dist');
const CLI_DIR = path.join(ROOT, 'tools', 'cli');
const STORE_KEY_MANIFEST = path.join(
  ROOT,
  'src',
  'assets',
  'manifest',
  'manifest-dev.json'
);

const BROWSER = process.env.STYLEBOT_BROWSER ?? 'chrome';

// Where each browser keeps its user data, under HOME, which is also where the CLI registers its host.
const USER_DATA_DIRS: Record<string, Record<string, string>> = {
  darwin: {
    chrome: 'Library/Application Support/Google/Chrome',
    edge: 'Library/Application Support/Microsoft Edge',
  },
  linux: { chrome: '.config/google-chrome', edge: '.config/microsoft-edge' },
};

const PINK = 'rgb(255, 0, 128)';
const BLUE = 'rgb(0, 0, 255)';
const BLACK = 'rgb(0, 0, 0)';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head><title>CLI test page</title></head>
    <body style="background: #fff">
      <h1>Styled from the command line</h1>
      <p>Some text to read.</p>
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
let context: BrowserContext;
let extensionId: string;
let baseUrl: string;
let closeServer: () => Promise<void>;
let env: NodeJS.ProcessEnv;

/**
 * Runs a CLI, this checkout's by default, as a child process in the test HOME.
 */
const cli = (args: Array<string>, cliDir = CLI_DIR): Promise<CliResult> =>
  new Promise(resolve =>
    execFile(
      process.execPath,
      [path.join(cliDir, 'lib', 'cli.mjs'), ...args],
      { cwd: home, env },
      (error, stdout, stderr) =>
        resolve({
          code: error ? Number(error.code ?? 1) : 0,
          stdout,
          stderr,
        })
    )
  );

/**
 * Runs a CLI command that must succeed, returning its output.
 */
const ok = async (args: Array<string>): Promise<string> => {
  const { code, stdout, stderr } = await cli(args);
  expect(stderr, `stylebot ${args.join(' ')}`).toBe('');
  expect(code).toBe(0);
  return stdout;
};

const json = async <T>(args: Array<string>): Promise<T> =>
  JSON.parse(await ok([...args, '--json'])) as T;

type Manifest = Record<string, Array<string> | string | undefined>;

/**
 * Copies the build with its manifest changed, and with the store's public
 * key, as `build:preview` adds it, for the store id the host allows.
 */
const copyBuild = (name: string, change: (manifest: Manifest) => void) => {
  const dir = path.join(home, name);
  fs.cpSync(DIST_PATH, dir, { recursive: true });

  const file = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { key } = JSON.parse(fs.readFileSync(STORE_KEY_MANIFEST, 'utf8'));

  change(manifest);
  fs.writeFileSync(file, JSON.stringify({ ...manifest, key }));

  return dir;
};

/**
 * The CLI's optional permissions made required, so loading this copy grants
 * them without the prompt headless Chrome can't show.
 */
const grantCliPermissions = (manifest: Manifest) => {
  manifest.permissions = [
    ...(manifest.permissions as Array<string>),
    ...(manifest.optional_permissions as Array<string>),
  ];
  manifest.host_permissions = [
    ...(manifest.host_permissions as Array<string>),
    ...(manifest.optional_host_permissions as Array<string>),
  ];
  delete manifest.optional_permissions;
  delete manifest.optional_host_permissions;
};

/**
 * Copies the CLI with its protocol number moved by `delta`, standing in for
 * a CLI from another release.
 */
const copyCliWithProtocol = (delta: number): string => {
  const dir = path.join(home, `cli-protocol${delta > 0 ? '+' : ''}${delta}`);
  fs.cpSync(CLI_DIR, dir, { recursive: true });
  fs.symlinkSync(
    path.join(ROOT, 'node_modules'),
    path.join(dir, 'node_modules')
  );

  const file = path.join(dir, 'lib', 'protocol.mjs');
  fs.writeFileSync(
    file,
    fs
      .readFileSync(file, 'utf8')
      .replace(
        /PROTOCOL = (\d+);/,
        (_, protocol) => `PROTOCOL = ${Number(protocol) + delta};`
      )
  );

  return dir;
};

const cliPage = (): Page | undefined =>
  context.pages().find(page => page.url() === `${baseUrl}/`);

test.skip(
  BROWSER === 'firefox' || !USER_DATA_DIRS[process.platform],
  'The CLI runs on Chrome and Edge, and this spec on macOS and Linux'
);

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({}, testInfo) => {
  testInfo.setTimeout(60_000);

  home = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-e2e-cli-'));
  env = { ...process.env, HOME: home };
  // Another browser's socket, from your shell, mustn't leak into the test.
  delete env.STYLEBOT_SOCKET;

  const userDataDir = path.join(
    home,
    USER_DATA_DIRS[process.platform][BROWSER]
  );
  fs.mkdirSync(userDataDir, { recursive: true });

  const engine = new ChromiumEngine();

  // The host the browser starts inherits HOME, so it listens in the test HOME too.
  context = await engine.launch(userDataDir, {
    headless: testInfo.project.use.headless ?? true,
    viewport: null,
    colorScheme: null,
    env,
  });

  context.on('page', page =>
    page.once('framenavigated', () => {
      if (/^https:\/\/stylebot\.dev\/welcome/.test(page.url())) {
        page.close().catch(() => {});
      }
    })
  );

  // Chrome keeps a permission granted when the next version makes it optional.
  await engine.loadExtension(
    context,
    copyBuild('granted', grantCliPermissions)
  );
  ({ id: extensionId } = await engine.loadExtension(
    context,
    copyBuild('stylebot', () => {})
  ));

  ({ baseUrl, close: closeServer } = await startTestServer({
    '/': PAGE_HTML,
    '/yours': OTHER_PAGE_HTML,
  }));

  // Registers the host in the test browser's user data, its only browser.
  await ok(['install']);
});

test.afterAll(async () => {
  await context?.close();
  await closeServer?.();
  fs.rmSync(home, { recursive: true, force: true });
});

test('with the setting off, a command says to turn it on', async () => {
  const { code, stderr } = await cli(['tabs']);

  expect(code).toBe(1);
  // Edge may not have saved the unpacked extension to its preferences yet, so the CLI also says to add it.
  expect(stderr).toMatch(
    /turn on "Let apps on this computer control Stylebot"/i
  );
});

test('turning the setting on in Options connects the CLI', async () => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html#/basics`);
  // A real click, so the permissions request has its user gesture.
  await options
    .getByRole('heading', {
      name: 'Let apps on this computer control Stylebot',
    })
    .click();
  await expect(
    options.getByRole('checkbox', {
      name: /Let apps on this computer control Stylebot/,
    })
  ).toBeChecked();

  await expect
    .poll(async () => (await cli(['tabs'])).code, { timeout: 15_000 })
    .toBe(0);

  await options.close();
});

test("open shows the page in the CLI's own window without switching yours", async () => {
  const yours = await context.newPage();
  await yours.goto(`${baseUrl}/yours`);

  const opened = await json<Tab & { created: boolean }>([
    'open',
    `${baseUrl}/`,
  ]);
  expect(opened.created).toBe(true);

  const tabs = await json<Array<Tab>>(['tabs']);
  const yourTab = tabs.find(tab => tab.url === `${baseUrl}/yours`);

  expect(yourTab?.active).toBe(true);
  expect(opened.windowId).not.toBe(yourTab?.windowId);

  const again = await json<Tab & { created: boolean }>(['open', baseUrl]);
  expect(again).toMatchObject({ created: false, id: opened.id });

  expect(await ok(['outline', String(opened.id)])).toContain(
    'Styled from the command line'
  );

  // Shown on the same site, it's the tab css set would otherwise check.
  await yours.close();
});

test('css set applies the css to the page and reports what the page check found', async () => {
  const page = cliPage();
  expect(page).toBeDefined();

  const file = path.join(home, 'pink.css');
  fs.writeFileSync(
    file,
    [
      `h1 { color: ${PINK}; }`,
      'p { color: #f4f4f4; }',
      '.not-on-the-page { color: red; }',
    ].join('\n')
  );

  const report = await ok(['css', 'set', 'localhost', '--file', file]);

  await expect(page!.locator('h1')).toHaveCSS('color', PINK);
  expect(report).toContain('Saved localhost');
  expect(report).toContain('- h1: 1 element');
  expect(report).toContain('- .not-on-the-page: 0 elements');
  expect(report).toContain(
    'Edits whose selector matched nothing changed nothing.'
  );
  expect(report).toMatch(/- Hard to read: .*\bp \(1 element\), text #f4f4f4/);
});

test('a write that names no site or tab is refused', async () => {
  const file = path.join(home, 'pink.css');

  for (const args of [
    ['css', 'set', '', '--file', file],
    ['screenshot', ''],
  ]) {
    const { code, stderr } = await cli(args);

    expect(code).toBe(1);
    expect(stderr).toContain("doesn't default to the active tab");
  }
});

test('profiles switch which css the page gets', async () => {
  const page = cliPage()!;

  await ok(['profile', 'create', 'Dark', 'localhost', '--use']);
  await expect(page.locator('h1')).toHaveCSS('color', BLACK);

  const file = path.join(home, 'blue.css');
  fs.writeFileSync(file, `h1 { color: ${BLUE}; }`);
  await ok(['css', 'set', 'localhost', '--file', file]);
  await expect(page.locator('h1')).toHaveCSS('color', BLUE);

  await ok(['profile', 'use', 'Default', 'localhost']);
  await expect(page.locator('h1')).toHaveCSS('color', PINK);
});

test("screenshot saves a png, and done closes the CLI's window", async () => {
  const page = cliPage()!;
  const [tab] = (await json<Array<Tab>>(['tabs'])).filter(
    ({ url }) => url === `${baseUrl}/`
  );
  const out = path.join(home, 'shots', 'page.png');

  expect((await ok(['screenshot', String(tab.id), '-o', out])).trim()).toBe(
    out
  );
  expect(fs.readFileSync(out).subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );

  expect(await ok(['done'])).toContain("Closed the CLI's window");
  await expect.poll(() => page.isClosed()).toBe(true);
});

test('a CLI on another protocol says which side to update', async () => {
  const ahead = await cli(['tabs'], copyCliWithProtocol(1));
  expect(ahead.code).toBe(1);
  expect(ahead.stderr).toContain('Update Stylebot in your browser.');

  const behind = await cli(['tabs'], copyCliWithProtocol(-1));
  expect(behind.code).toBe(1);
  expect(behind.stderr).toContain('npm update -g @stylebot/cli');
});
