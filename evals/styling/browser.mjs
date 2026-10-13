import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { replayHars } from './replay.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

// Where Chrome keeps its user data under HOME, which is also where the CLI registers its host.
const USER_DATA_DIRS = {
  darwin: 'Library/Application Support/Google/Chrome',
  linux: '.config/google-chrome',
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Chrome launch options shared by the plain browser and the extension's.
 */
export const launchOptions = ({ viewport, env }) => ({
  headless: true,
  channel: 'chrome',
  viewport,
  env,
  ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
  args: [
    // Required for Extensions.loadUnpacked, as Chrome 137+ dropped --load-extension.
    '--enable-unsafe-extension-debugging',
    '--disable-gpu',
    '--window-size=1400,1000',
  ],
});

/**
 * Copies the build with its manifest changed.
 */
const copyBuild = (build, dir, change = () => {}) => {
  fs.cpSync(build, dir, { recursive: true });
  const file = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  change(manifest);
  fs.writeFileSync(file, JSON.stringify(manifest));
  return dir;
};

/**
 * The CLI's optional permissions made required, so loading this copy grants
 * them without the prompt headless Chrome can't show.
 */
const grantOptional = manifest => {
  manifest.permissions.push(...(manifest.optional_permissions ?? []));
  manifest.host_permissions.push(...(manifest.optional_host_permissions ?? []));
  delete manifest.optional_permissions;
  delete manifest.optional_host_permissions;
};

/**
 * Writes the `stylebot` command the agent runs: the checkout's CLI, with
 * HOME pointed at the task's own, so it reaches this task's browser and
 * nothing it sets up touches yours.
 */
const writeCommand = (binDir, cli, home) => {
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(
    path.join(binDir, 'stylebot'),
    `#!/bin/sh\nunset STYLEBOT_SOCKET\nHOME="${home}" exec "${process.execPath}" "${cli}" "$@"\n`,
    { mode: 0o755 }
  );
  return binDir;
};

/**
 * A fresh Chrome for one task, in a HOME of its own under dir: the build
 * loaded, every recorded page served from its HAR, the checkout's CLI
 * registered as its native host and "Allow command line access" turned on,
 * as a user who set the CLI up would have it.
 */
export const launchExtensionBrowser = async ({
  dir,
  build,
  cli,
  hars,
  viewport,
}) => {
  const userDataDir = USER_DATA_DIRS[process.platform];
  if (!userDataDir) {
    throw new Error('The styling eval runs on macOS and Linux');
  }

  const home = path.join(dir, 'home');
  fs.mkdirSync(path.join(home, userDataDir), { recursive: true });
  const env = { ...process.env, HOME: home };
  delete env.STYLEBOT_SOCKET;

  const run = args =>
    new Promise(resolve =>
      execFile(
        process.execPath,
        [cli, ...args],
        { cwd: home, env },
        (error, stdout, stderr) =>
          resolve({ ok: !error, out: (stdout + stderr).trimEnd() })
      )
    );

  // The host the browser starts inherits HOME, so it listens in the task's HOME too.
  const context = await chromium.launchPersistentContext(
    path.join(home, userDataDir),
    launchOptions({ viewport, env })
  );
  context.on('page', page =>
    page.once('framenavigated', () => {
      if (page.url().includes('stylebot.dev/welcome')) {
        page.close().catch(() => {});
      }
    })
  );
  await replayHars(context.browser(), hars);

  const cdp = await context.browser().newBrowserCDPSession();
  const load = async extensionDir =>
    (await cdp.send('Extensions.loadUnpacked', { path: extensionDir })).id;
  // Chrome keeps the optional permissions this copy granted when the real one replaces it.
  await load(copyBuild(build, path.join(dir, 'granted'), grantOptional));
  const id = await load(copyBuild(build, path.join(dir, 'extension')));

  const installed = await run(['install']);
  const options = await context.newPage();
  await options.goto(`chrome-extension://${id}/options.html#/basics`);
  await options
    .getByRole('heading', { name: 'Allow command line access' })
    .click();

  let connected = await run(['tabs']);
  for (let i = 0; i < 40 && !connected.ok; i++) {
    await wait(500);
    connected = await run(['tabs']);
  }
  await options.close();
  if (!connected.ok) {
    await context.close();
    throw new Error(
      `The CLI couldn't reach the extension: ${connected.out}\n${installed.out}`
    );
  }

  return {
    context,
    bin: writeCommand(path.join(dir, 'bin'), cli, home),
    cli: run,
  };
};
