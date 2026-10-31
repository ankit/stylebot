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

const DARK = 'rgb(20, 20, 20)';
const WHITE = 'rgb(255, 255, 255)';
const GREEN = 'rgb(0, 128, 0)';

/**
 * A page whose rows, field and a cross-origin stylesheet style :hover and
 * :focus-visible, which the CLI can't reach with a real pointer.
 */
const statesPageHtml = (crossOrigin: string) => `
  <!doctype html>
  <html>
    <head>
      <title>States</title>
      <style>
        .row { background: ${DARK}; color: ${WHITE}; transition: background 2s; }
        .row:hover { background: ${WHITE}; }
        .row:hover .icon { color: ${PINK}; }
        input:focus-visible { outline: 3px solid ${BLUE}; }
      </style>
      <link rel="stylesheet" href="${crossOrigin}/remote.css">
    </head>
    <body>
      <div class="row"><span class="icon">*</span> First</div>
      <div class="row"><span class="icon">*</span> Second</div>
      <input name="q">
      <p class="remote">Styled from another origin</p>
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
  delete manifest.optional_permissions;
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

/**
 * Launches a browser with its user data in the test HOME and Stylebot in it,
 * granted the CLI's permissions.
 */
const launchBrowser = async (userDataDir: string, headless: boolean) => {
  fs.mkdirSync(userDataDir, { recursive: true });

  const engine = new ChromiumEngine();

  // The host the browser starts inherits HOME, so it listens in the test HOME too.
  const context = await engine.launch(userDataDir, {
    headless,
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
  const { id } = await engine.loadExtension(
    context,
    copyBuild('stylebot', () => {})
  );

  return { context, extensionId: id };
};

/**
 * Turns on the CLI setting in Options, as a user would.
 */
const turnOnCli = async (browser: BrowserContext, id: string) => {
  const options = await browser.newPage();
  await options.goto(`chrome-extension://${id}/options.html#/basics`);
  // A real click, so the permissions request has its user gesture.
  await options
    .getByRole('heading', {
      name: 'Allow command line access',
    })
    .click();
  await expect(
    options.getByRole('checkbox', {
      name: /Allow command line access/,
    })
  ).toBeChecked();
  await options.close();
};

const cliPage = (): Page | undefined =>
  context.pages().find(page => page.url() === `${baseUrl}/`);

type DomNode = {
  nodeType: number;
  nodeName: string;
  nodeValue: string;
  children?: Array<DomNode>;
  shadowRoots?: Array<DomNode>;
};

/**
 * The text CLI mode's terminal shows on a page, read through CDP since it
 * sits in a closed shadow root; null when the page has no terminal.
 */
const terminalText = async (page: Page): Promise<string | null> => {
  const session = await context.newCDPSession(page);

  try {
    const { root } = (await session.send('DOM.getDocument', {
      depth: -1,
      pierce: true,
    })) as { root: DomNode };

    const find = (node: DomNode): DomNode | undefined =>
      node.nodeName === 'STYLEBOT-CLI-MODE'
        ? node
        : [...(node.children ?? []), ...(node.shadowRoots ?? [])]
            .map(find)
            .find(Boolean);

    const textOf = (node: DomNode): string => {
      if (node.nodeType === 3) {
        return node.nodeValue;
      }

      if (node.nodeName === 'STYLE') {
        return '';
      }

      return [...(node.shadowRoots ?? []), ...(node.children ?? [])]
        .map(textOf)
        .join(' ');
    };

    const host = find(root);

    return host ? textOf(host).replace(/\s+/g, ' ').trim() : null;
  } finally {
    await session.detach();
  }
};

test.skip(
  BROWSER === 'firefox' || !USER_DATA_DIRS[process.platform],
  'The CLI runs on Chrome and Edge, and this spec on macOS and Linux'
);

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({}, testInfo) => {
  testInfo.setTimeout(60_000);

  // Short, as macOS caps a socket's path, which the host's is in this HOME, at 103 bytes.
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-cli-'));
  env = { ...process.env, HOME: home };
  // Another browser's socket, from your shell, mustn't leak into the test.
  delete env.STYLEBOT_SOCKET;

  ({ context, extensionId } = await launchBrowser(
    path.join(home, USER_DATA_DIRS[process.platform][BROWSER]),
    testInfo.project.use.headless ?? true
  ));

  const routes: Parameters<typeof startTestServer>[0] = {
    '/': PAGE_HTML,
    '/yours': OTHER_PAGE_HTML,
    '/remote.css': {
      body: `.remote:hover { color: ${GREEN}; }`,
      headers: { 'Content-Type': 'text/css' },
    },
  };
  ({ baseUrl, close: closeServer } = await startTestServer(routes));
  // Another origin on the same server, whose sheet the page can't read.
  routes['/states'] = statesPageHtml(baseUrl.replace('localhost', '127.0.0.1'));

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
  expect(stderr).toMatch(/turn on "Allow command line access"/i);
});

test('turning the setting on in Options connects the CLI', async () => {
  await turnOnCli(context, extensionId);

  await expect
    .poll(async () => (await cli(['tabs'])).code, { timeout: 15_000 })
    .toBe(0);
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

test('css set reports only the rules a save changed, unless --verbose', async () => {
  const file = path.join(home, 'pink.css');
  fs.writeFileSync(
    file,
    [`h1 { color: ${PINK}; }`, 'p { color: #333333; }'].join('\n')
  );

  const report = await ok(['css', 'set', 'localhost', '--file', file]);

  expect(report).toContain('- p: 1 element');
  expect(report).not.toContain('- h1:');
  expect(report).toContain('Removed rules:\n- .not-on-the-page');
  expect(report).toContain('1 unchanged rule not listed');

  expect(await ok(['css', 'set', 'localhost', '--file', file])).toContain(
    'No rules changed since the last save.'
  );

  const verbose = await ok([
    'css',
    'set',
    'localhost',
    '--file',
    file,
    '--verbose',
  ]);
  expect(verbose).toContain('- h1: 1 element');
  expect(verbose).toContain('- p: 1 element');
});

test("css set checks the CLI window's tab, naming the others, or the tab given", async () => {
  const yours = await context.newPage();
  await yours.goto(`${baseUrl}/yours`);

  const opened = await json<Tab>(['open', baseUrl]);
  const tabs = await json<Array<Tab>>(['tabs']);
  const yourTab = tabs.find(tab => tab.url === `${baseUrl}/yours`)!;

  const file = path.join(home, 'two-tabs.css');
  fs.writeFileSync(file, `h1 { color: ${BLUE}; }`);

  const report = await ok(['css', 'set', 'localhost', '--file', file]);
  expect(report).toContain(`Checked on tab ${opened.id}.`);
  expect(report).toContain(
    `Also shown on tab ${yourTab.id}: name a tab id instead of the site to check that tab.`
  );

  fs.writeFileSync(file, `h1 { color: ${PINK}; }`);
  const named = await ok(['css', 'set', String(yourTab.id), '--file', file]);
  expect(named).toContain('Saved localhost');
  expect(named).toContain(`Checked on tab ${yourTab.id}.`);
  expect(named).toContain('- h1: 0 elements');
  expect(named).not.toContain('Also shown on');

  await yours.close();
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

  fs.writeFileSync(file, `h1 { color: ${BLACK}; }`);
  const report = await ok([
    'css',
    'set',
    'localhost',
    '--file',
    file,
    '--profile',
    'Dark',
  ]);
  expect(report).toContain("Not checked: Dark isn't the profile in use");
  await expect(page.locator('h1')).toHaveCSS('color', PINK);
  expect(await ok(['css', 'get', 'localhost', '--profile', 'Dark'])).toContain(
    `color: ${BLACK}`
  );
});

test('css rule edits one rule in place, and creates one that is missing', async () => {
  const page = cliPage()!;

  const report = await ok([
    'css',
    'rule',
    'localhost',
    'h1',
    '--set',
    `color=${BLUE}`,
  ]);

  await expect(page.locator('h1')).toHaveCSS('color', BLUE);
  expect(report).toContain('Saved localhost');
  expect(report).toContain('- h1: 1 element');
  expect(await ok(['css', 'get', 'localhost'])).toBe(
    `h1 { color: ${BLUE}; }\n`
  );

  const created = await ok([
    'css',
    'rule',
    'localhost',
    'h2',
    '--set',
    'color=red',
  ]);
  expect(created).toContain('Created a rule for h2 at the end');
  expect(created).toContain('- h2: 0 elements');
  expect(created).toContain('1 unchanged rule not listed');
});

test('css rule finds a rule it saved by a generated class name', async () => {
  const hashed = ['css', 'rule', 'localhost', '.Title_main__a1B2c'];

  await ok([...hashed, '--set', 'color=red']);
  const again = await ok([...hashed, '--set', 'margin=0']);
  expect(again).not.toContain('Created a rule');

  const saved = await ok(['css', 'get', 'localhost', '--grep', 'Title_main']);
  expect(saved.match(/\{/g)).toHaveLength(1);
  expect(saved).toContain('margin: 0');

  await ok([...hashed, '--delete']);
  expect(await ok(['css', 'get', 'localhost', '--grep', 'Title_main'])).toBe(
    'No rules in localhost match "Title_main"\n'
  );
});

test('css add appends rules, naming selectors that already had one', async () => {
  const page = cliPage()!;
  const file = path.join(home, 'more.css');
  fs.writeFileSync(file, 'h1 { font-size: 40px; }\n');

  const diff = await ok(['css', 'diff', 'localhost', '--file', file]);
  expect(diff).toContain('- h2 {');
  expect(diff).toContain('Nothing saved.');
  await expect(page.locator('h1')).not.toHaveCSS('font-size', '40px');

  const report = await ok(['css', 'add', 'localhost', '--file', file]);

  await expect(page.locator('h1')).toHaveCSS('font-size', '40px');
  await expect(page.locator('h1')).toHaveCSS('color', BLUE);
  expect(report).toContain('Added after rules with the same selector');
  expect(report).toContain('- h1: 1 element');

  expect(await ok(['css', 'get', 'localhost', '--grep', '40PX'])).toBe(
    'h1 { font-size: 40px; }\n'
  );
});

/**
 * A PNG's width and height, from its header.
 */
const pngSize = (file: string): { width: number; height: number } => {
  const png = fs.readFileSync(file);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

test('screenshot shoots at 1x, an element, or a clip, and says how big', async () => {
  const page = cliPage()!;
  const [tab] = (await json<Array<Tab>>(['tabs'])).filter(
    ({ url }) => url === `${baseUrl}/`
  );
  const id = String(tab.id);
  const out = path.join(home, 'shots', 'part.png');
  const viewport = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
  }));

  await page.evaluate(() => {
    const box = (id: string, style: string) => {
      const el = document.createElement('div');
      el.id = id;
      el.style.cssText = style;
      document.body.append(el);
    };
    box(
      'below',
      'margin-top: 2000px; width: 200px; height: 50px; background: red'
    );
    box('tall', 'width: 300px; height: 5000px; background: blue');
  });

  const full = await ok(['screenshot', id, '-o', out]);
  expect(pngSize(out)).toEqual(viewport);
  expect(full).toContain(
    `${viewport.width}×${viewport.height}, scale 1 (1 image px = 1 CSS px)`
  );

  await ok(['screenshot', id, '-o', out, '--scale', '2']);
  expect(pngSize(out)).toEqual({
    width: viewport.width * 2,
    height: viewport.height * 2,
  });

  const clip = await ok([
    'screenshot',
    id,
    '-o',
    out,
    '--clip',
    '10,20,300,40',
  ]);
  expect(pngSize(out)).toEqual({ width: 300, height: 40 });
  expect(clip).toContain('300×40, scale 1');

  const below = await ok(['screenshot', id, '-o', out, '--selector', '#below']);
  expect(pngSize(out)).toEqual({ width: 208, height: 58 });
  expect(below).not.toContain('Cut off');
  expect(await page.evaluate(() => scrollY)).toBe(0);

  const tall = await ok(['screenshot', id, '-o', out, '--selector', '#tall']);
  expect(pngSize(out)).toEqual({ width: 308, height: viewport.height });
  expect(tall).toContain('Cut off');
  expect(await page.evaluate(() => scrollY)).toBe(0);

  const missing = await cli(['screenshot', id, '--selector', '.missing']);
  expect(missing.code).toBe(1);
  expect(missing.stderr).toContain('No visible element matches .missing');

  await page.evaluate(() =>
    document.querySelectorAll('#below, #tall').forEach(el => el.remove())
  );
});

test("force applies the page's state rules, and --clear takes them off", async () => {
  const opened = await json<Tab>(['open', `${baseUrl}/states`]);
  const id = String(opened.id);
  const computed = async (selector: string, property: string) =>
    (await ok(['computed-styles', selector, property, '--tab', id])).trim();

  expect(await computed('.row', 'background-color')).toBe(
    `background-color: ${DARK};`
  );

  expect(await ok(['force', id, '.row', 'hover'])).toBe(
    'Forced hover on .row (1 element, 2 ancestors).\n'
  );
  expect(await computed('.row', 'background-color')).toBe(
    `background-color: ${WHITE};`
  );
  expect(await computed('.row .icon', 'color')).toBe(`color: ${PINK};`);
  expect(await computed('.row + .row', 'background-color')).toBe(
    `background-color: ${DARK};`
  );

  await ok(['force', id, 'input', 'focus-visible']);
  expect(await computed('input', 'outline')).toBe(
    `outline: ${BLUE} solid 3px;`
  );

  await ok(['force', id, '.remote', 'hover']);
  expect(await computed('.remote', 'color')).toBe(`color: ${GREEN};`);

  expect(await ok(['force', id])).toBe(
    [
      'Forced:',
      '- hover on .row (1 element, 2 ancestors)',
      '- focus-visible on input (1 element, 2 ancestors)',
      '- hover on .remote (1 element, 2 ancestors)',
      '',
    ].join('\n')
  );

  // A save rewrites Stylebot's own sheet, whose state rules follow it.
  const file = path.join(home, 'states.css');
  fs.writeFileSync(file, `.row:hover { background: ${GREEN}; }`);
  await ok(['css', 'set', id, '--file', file]);
  expect(await computed('.row', 'background-color')).toBe(
    `background-color: ${GREEN};`
  );

  expect(await ok(['force', id, '--clear'])).toBe(
    'Cleared hover on .row, focus-visible on input, hover on .remote.\n'
  );
  expect(await computed('.row', 'background-color')).toBe(
    `background-color: ${DARK};`
  );
  expect(await computed('.row .icon', 'color')).toBe(`color: ${WHITE};`);
  expect(await computed('.remote', 'color')).not.toBe(`color: ${GREEN};`);
  expect(await ok(['force', id])).toBe('Nothing is forced.\n');

  const all = await ok(['force', id, '.row', 'hover', '--all']);
  expect(all).toBe('Forced hover on .row (2 elements, 2 ancestors).\n');
  await ok(['force', id, '--clear']);

  const out = path.join(home, 'shots', 'hover.png');
  const shot = await ok([
    'screenshot',
    id,
    '--state',
    'hover',
    '--on',
    '.row',
    '--selector',
    '.row',
    '-o',
    out,
  ]);
  expect(shot).toContain('With hover forced on .row');
  expect(await ok(['force', id])).toBe('Nothing is forced.\n');
});

test("mode connects the user's tab, whose terminal follows what the agent does there", async () => {
  test.setTimeout(60_000);

  const yours = await context.newPage();
  await yours.goto(`${baseUrl}/yours`);

  const yourTab = (await json<Array<Tab>>(['tabs'])).find(
    tab => tab.url === `${baseUrl}/yours`
  )!;
  const id = String(yourTab.id);

  expect(await ok(['mode', id])).toBe(`CLI mode is on in tab ${id}.\n`);
  await expect
    .poll(() => terminalText(yours))
    .toContain('queued until your agent runs stylebot');

  expect(await ok(['tabs'])).toContain(`${baseUrl}/yours  [CLI mode]`);
  expect(await json(['open', `${baseUrl}/yours`])).toMatchObject({
    created: false,
    cliMode: true,
    id: yourTab.id,
  });

  const before = await yours.evaluate(
    () => getComputedStyle(document.body).color
  );

  await ok(['outline', id]);
  await ok(['css', 'rule', id, 'body', '--set', 'color=blue']);
  await expect(yours.locator('body')).toHaveCSS('color', BLUE);
  await expect
    .poll(() => terminalText(yours))
    .toContain('stylebot css rule body --set color=blue');

  // Once the agent pauses, its commands fold into one line.
  await expect
    .poll(() => terminalText(yours), { timeout: 15_000 })
    .toContain('ran 2 commands · saved 1 time [undo]');

  const shot = await ok([
    'screenshot',
    id,
    '-o',
    path.join(home, 'shots', 'cli-mode.png'),
  ]);
  expect(shot).toMatch(
    /Stylebot's CLI mode terminal covers \d+,\d+ \d+×\d+ of the image/
  );

  // Z undoes the agent's last save from anywhere on the page.
  await yours.bringToFront();
  await yours.keyboard.press('z');
  await expect(yours.locator('body')).toHaveCSS('color', before);

  // The terminal comes back after a reload.
  await yours.reload();
  await expect.poll(() => terminalText(yours)).toContain('agent connected');

  expect(await ok(['mode', id, '--off'])).toBe(
    `CLI mode is off in tab ${id}.\n`
  );
  await expect.poll(() => terminalText(yours)).toBeNull();
  expect(await ok(['tabs'])).not.toContain('[CLI mode]');
  expect(
    await ok(['screenshot', id, '-o', path.join(home, 'shots', 'off.png')])
  ).not.toContain('CLI mode terminal');

  await yours.close();
});

test("screenshot saves a png, and done closes the CLI's window", async () => {
  const page = cliPage()!;
  const [tab] = (await json<Array<Tab>>(['tabs'])).filter(
    ({ url }) => url === `${baseUrl}/`
  );
  const out = path.join(home, 'shots', 'page.png');

  expect(
    (await ok(['screenshot', String(tab.id), '-o', out])).split('\n')[0]
  ).toBe(out);
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

test('with Stylebot in two browsers, the CLI asks which and uses the one named', async ({}, testInfo) => {
  testInfo.setTimeout(60_000);

  const first = USER_DATA_DIRS[process.platform][BROWSER];
  const userDataDir = path.join(home, `${first} Second`);
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.cpSync(
    path.join(home, first, 'NativeMessagingHosts'),
    path.join(userDataDir, 'NativeMessagingHosts'),
    { recursive: true }
  );

  const second = await launchBrowser(
    userDataDir,
    testInfo.project.use.headless ?? true
  );

  try {
    await turnOnCli(second.context, second.extensionId);
    const page = await second.context.newPage();
    await page.goto(`${baseUrl}/yours`);
    await page.bringToFront();

    type Browser = { key: string; page?: { url: string } };
    const browsers = async () => json<Array<Browser>>(['browsers']);

    await expect
      .poll(async () => (await browsers()).length, { timeout: 15_000 })
      .toBe(2);

    const listed = await browsers();
    const secondKey = listed.find(
      ({ page }) => page?.url === `${baseUrl}/yours`
    )!.key;
    const firstKey = listed.find(({ key }) => key !== secondKey)!.key;

    const { code, stderr } = await cli(['tabs']);
    expect(code).toBe(1);
    expect(stderr).toContain(
      'Stylebot is running in 2 browsers. Name the one to use with --browser:'
    );
    expect(stderr).toContain(secondKey);

    const tabsIn = async (key: string) =>
      (await json<Array<Tab>>(['tabs', '--browser', key])).map(
        ({ url }) => url
      );
    expect(await tabsIn(secondKey)).toContain(`${baseUrl}/yours`);
    expect(await tabsIn(firstKey)).not.toContain(`${baseUrl}/yours`);

    const unknown = await cli(['tabs', '--browser', 'netscape']);
    expect(unknown.code).toBe(1);
    expect(unknown.stderr).toContain(
      'Stylebot isn\'t running in a browser named "netscape"'
    );
  } finally {
    await second.context.close();
  }

  // With the second browser gone, commands go to the first again without asking.
  await expect
    .poll(async () => (await cli(['tabs'])).code, { timeout: 15_000 })
    .toBe(0);
});
