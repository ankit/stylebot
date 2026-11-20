// The command line shot: a real CLI mode terminal, from a browser of its own
// with the CLI connected, over a page it restyled.

import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { rootDir } from '../lib/cli.mjs';
import {
  WINDOW,
  closeWelcomeTabs,
  launchOptions,
  loadExtension,
  render,
  sharp,
  slide,
  wait,
} from './browser.mjs';
import { URL, runCliMode, terminalImage } from './cli-mode-steps.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

// The tab CLI mode runs in, which the shot doesn't show.
const VIEWPORT = { width: 1120, height: 760 };

/**
 * Starts a browser whose HOME is a temporary folder, with the CLI's host
 * registered there and the extension allowed to talk to it, as the e2e suite
 * does: nothing touches ~/.stylebot or your browsers.
 */
export const startCliBrowser = async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-store-'));
  const env = { ...process.env, HOME: home };
  delete env.STYLEBOT_SOCKET;

  const cli = args =>
    new Promise(resolve =>
      execFile(
        process.execPath,
        [path.join(rootDir, 'tools/cli/lib/cli.mjs'), ...args],
        { cwd: home, env },
        (error, stdout, stderr) =>
          resolve({ ok: !error, out: (stdout + stderr).trimEnd() })
      )
    );

  // The store's key, so the copies get the extension id the host allows.
  const { key } = JSON.parse(
    fs.readFileSync(
      path.join(rootDir, 'src/assets/manifest/manifest-dev.json'),
      'utf8'
    )
  );
  const copyBuild = (name, change = () => {}) => {
    const dir = path.join(home, name);
    fs.cpSync(path.join(rootDir, 'dist'), dir, { recursive: true });
    const file = path.join(dir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    change(manifest);
    fs.writeFileSync(file, JSON.stringify({ ...manifest, key }));
    return dir;
  };

  const userDataDir = path.join(
    home,
    process.platform === 'darwin'
      ? 'Library/Application Support/Google/Chrome'
      : '.config/google-chrome'
  );
  fs.mkdirSync(userDataDir, { recursive: true });

  const context = await chromium.launchPersistentContext(
    userDataDir,
    launchOptions({ appearance: 'light', env })
  );
  closeWelcomeTabs(context);

  // Chrome keeps the CLI's optional permissions granted when this first
  // copy, which requires them, is replaced by the real one.
  await loadExtension(
    context,
    copyBuild('granted', manifest => {
      manifest.permissions.push(...(manifest.optional_permissions ?? []));
      manifest.host_permissions.push(
        ...(manifest.optional_host_permissions ?? [])
      );
      delete manifest.optional_permissions;
      delete manifest.optional_host_permissions;
    })
  );
  const id = await loadExtension(context, copyBuild('stylebot'));
  await cli(['install']);

  const options = await context.newPage();
  await options.goto(`chrome-extension://${id}/options.html#/basics`);
  await options
    .getByRole('heading', {
      name: 'Allow command line access',
    })
    .click();
  for (let i = 0; i < 30 && !(await cli(['tabs'])).ok; i++) {
    await wait(500);
  }
  await options.close();

  return {
    context,
    home,
    env,
    cli,
    close: async () => {
      await context.close();
      fs.rmSync(home, { recursive: true, force: true });
    },
  };
};

// What the note asks of the Gallery screenshot under the terminal, and the
// agent's answer; rewrite both if that screenshot changes.
const NOTE = 'set posts in a serif, soften the colours, hide the sidebar';
const REPLY =
  'Posts are in Literata now, on soft off-white paper, and the right sidebar is hidden. Press Z to undo.';

// Where the page screenshot is cut: past Reddit's left nav, so the posts and
// the empty right rail, where the terminal sits, fill the slide.
const PAGE_LEFT = 276;
const MARGIN = 24;

/**
 * Takes CLI mode as a slide: a real CLI mode terminal, after the agent's
 * answer, over `page`, a 2x screenshot of the page it describes. Reddit
 * keeps headless Chrome out, so the terminal runs on Hacker News.
 */
export const captureCliMode = async (file, { slide: frame }, page) => {
  const browser = await startCliBrowser();

  try {
    const tab = await browser.context.newPage();
    await tab.setViewportSize(VIEWPORT);
    await tab.goto(URL, { waitUntil: 'load' });
    await tab.bringToFront();
    await wait(1500);

    let terminal;
    await runCliMode(
      browser,
      tab,
      async moment => {
        if (moment === 'reply') {
          terminal = await terminalImage(tab);
        }
      },
      { note: NOTE, reply: REPLY }
    );

    const pageSize = await sharp(page).metadata();
    const terminalSize = await sharp(terminal).metadata();
    const width = pageSize.width / 2 - PAGE_LEFT;
    const height = Math.round((width * WINDOW.height) / WINDOW.width);
    const dataUrl = (image, type) =>
      `data:image/${type};base64,${image.toString('base64')}`;

    const image = await render(
      browser.context,
      `<body style="margin:0;position:relative;overflow:hidden;height:${height}px">
        <img src="${dataUrl(
          page,
          pageSize.format
        )}" style="display:block;width:${
        pageSize.width / 2
      }px;margin-left:${-PAGE_LEFT}px">
        <img src="${dataUrl(
          terminal,
          'png'
        )}" style="position:absolute;right:${MARGIN}px;bottom:${MARGIN}px;width:${
        terminalSize.width / 2
      }px">
      </body>`,
      null,
      { scale: 'device', width, height }
    );
    await slide(browser.context, { image, width }, file, frame);
  } finally {
    await browser.close();
  }
};
