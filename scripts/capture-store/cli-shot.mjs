// The command line shot: the real CLI restyles Hacker News in a browser of its
// own, and its output is shown as a Claude Code session beside the page.

import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { rootDir } from '../lib/cli.mjs';
import {
  HEIGHT,
  WIDTH,
  closeWelcomeTabs,
  launchOptions,
  loadExtension,
  render,
  wait,
} from './browser.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

const SITE = 'news.ycombinator.com';
const PROFILE = 'Claude: Newspaper';
const CSS_FILE = '~/.stylebot/work/hn.css';
const PROMPT = '/stylebot make Hacker News look like a newspaper';
// What Claude says it did; rewrite it when the theme changes.
const SUMMARY = `Hacker News is now a broadsheet: a Playfair Display masthead with a dateline, small-caps section links, Old Standard type on newsprint, and a rule between stories. It’s saved as the “${PROFILE}” profile, so your own style is one switch away.`;

const TERMINAL_WIDTH = 620;
const PAGE_WIDTH = WIDTH - TERMINAL_WIDTH - 1;

const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * Starts a browser whose HOME is a temporary folder, with the CLI's host
 * registered there and the extension allowed to talk to it, as the e2e suite
 * does: nothing touches ~/.stylebot or your browsers.
 */
const startCliBrowser = async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-store-cli-'));
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
      name: 'Let apps on this computer control Stylebot',
    })
    .click();
  for (let i = 0; i < 30 && !(await cli(['tabs'])).ok; i++) {
    await wait(500);
  }
  await options.close();

  return {
    context,
    home,
    cli,
    close: async () => {
      await context.close();
      fs.rmSync(home, { recursive: true, force: true });
    },
  };
};

/**
 * Lines of a tool call's output, folded as Claude Code folds them.
 */
const fold = (out, keep) => {
  const lines = out.split('\n');
  return lines.length > keep + 1
    ? [
        ...lines.slice(0, keep),
        `… +${lines.length - keep} lines (ctrl+o to expand)`,
      ]
    : lines;
};

const toolCall = (name, args, lines) => `
  <div class="step"><span class="ok">⏺</span> <b>${name}</b>(${escape(args)
  .split(' ')
  .map(word => `<span class="word">${word}</span>`)
  .join(' ')})</div>
  ${lines
    .map(
      (line, i) =>
        `<div class="out">${i ? '&nbsp;&nbsp;&nbsp;' : '⎿&nbsp;&nbsp;'}${escape(
          line
        )}</div>`
    )
    .join('')}`;

const terminal = ({ tab, steps, pageImage }) => `
<html><head><style>
  body { margin: 0; display: flex; gap: 1px; height: ${HEIGHT}px; background: #000; font-family: Menlo, monospace; }
  .term { width: ${TERMINAL_WIDTH}px; background: #1a1a1a; color: #e6e6e6; font-size: 13.5px; line-height: 1.6; display: flex; flex-direction: column; }
  .bar { height: 34px; display: flex; align-items: center; gap: 8px; padding: 0 14px; background: #262626; color: #9a9a9a; font: 12px -apple-system, system-ui, sans-serif; }
  .bar i { width: 12px; height: 12px; border-radius: 50%; }
  .bar span { flex: 1; text-align: center; margin-right: 52px; }
  .body { padding: 16px 18px; overflow: hidden; }
  .ask { color: #fff; background: #2a2a2a; padding: 6px 10px; border-radius: 4px; margin-bottom: 16px; }
  .step { margin-top: 16px; padding-left: 18px; text-indent: -18px; }
  .step b { color: #fff; }
  .word { white-space: nowrap; }
  .ok { color: #4eba65; }
  .out { color: #9a9a9a; white-space: pre; padding-left: 16px; overflow: hidden; text-overflow: ellipsis; }
  .say { display: flex; gap: 9px; margin-top: 20px; }
  .prompt { border: 1px solid #444; border-radius: 6px; padding: 8px 10px; color: #777; margin-top: 18px; }
  img { display: block; width: ${PAGE_WIDTH}px; height: ${HEIGHT}px; }
</style></head><body>
  <div class="term">
    <div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>claude</span></div>
    <div class="body">
      <div class="ask">&gt; ${escape(PROMPT)}</div>
      ${toolCall('Bash', `stylebot open ${SITE}`, steps.open.split('\n'))}
      ${toolCall('Bash', `stylebot outline ${tab}`, fold(steps.outline, 3))}
      ${toolCall('Write', CSS_FILE, [
        `Wrote ${steps.cssLines} lines to ${CSS_FILE}`,
      ])}
      ${toolCall(
        'Bash',
        `stylebot profile create "${PROFILE}" ${SITE} --use`,
        steps.profile.split('\n')
      )}
      ${toolCall(
        'Bash',
        `stylebot css set ${SITE} --file ${CSS_FILE}`,
        fold(steps.css, 3)
      )}
      <div class="say"><span>⏺</span><span>${escape(SUMMARY)}</span></div>
      <div class="prompt">&gt;</div>
    </div>
  </div>
  <img src="data:image/png;base64,${pageImage}">
</body></html>`;

/**
 * Restyles Hacker News with `css` through the CLI and saves the session
 * beside the restyled page.
 */
export const captureCli = async (file, css) => {
  const browser = await startCliBrowser();

  try {
    const open = (await browser.cli(['open', SITE])).out;
    const tab = open.match(/\d{5,}/)?.[0];
    if (!tab) {
      throw new Error(`stylebot open printed no tab: ${open}`);
    }
    await wait(2500);
    const outline = (await browser.cli(['outline', tab])).out;
    const profile = (
      await browser.cli(['profile', 'create', PROFILE, SITE, '--use'])
    ).out;

    const cssFile = path.join(browser.home, 'hn.css');
    fs.writeFileSync(cssFile, css);
    const cssOut = (await browser.cli(['css', 'set', SITE, '--file', cssFile]))
      .out;
    await wait(2500);

    const page = browser.context.pages().find(p => p.url().includes(SITE));
    await page.setViewportSize({ width: PAGE_WIDTH, height: HEIGHT });
    await wait(1500);
    const pageImage = (await page.screenshot()).toString('base64');

    await render(
      browser.context,
      terminal({
        tab,
        pageImage,
        steps: {
          open,
          outline,
          profile,
          css: cssOut,
          cssLines: css.trimEnd().split('\n').length,
        },
      }),
      file
    );
  } finally {
    await browser.close();
  }
};
