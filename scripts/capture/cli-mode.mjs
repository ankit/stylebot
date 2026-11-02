// Takes the stylebot.dev command line page's screenshots of CLI mode from the
// current build into captures/cli/, cut to the terminal: the real CLI
// connects Hacker News, marks two areas, sends a note about them and answers
// it with a change.
//
//   yarn capture:cli-mode [--out <dir>] [--no-build]

import { spawn } from 'node:child_process';
import path from 'node:path';

import { bin, rootDir, runOrExit } from '../lib/cli.mjs';
import { sharp, wait } from './browser.mjs';
import { startCliBrowser } from './cli-shot.mjs';
import { capturesDir, shownPath, takeOutput } from './output.mjs';

const URL = 'https://news.ycombinator.com/';
const NOTE = 'make this bar dark, and set the titles in a serif';
const REPLY =
  'The top bar is dark now, and the titles are in Georgia. Press Z to undo.';
const RULES = [
  ['#hnmain > tbody > tr:first-child > td', ['background-color=#1d1f23']],
  ['.pagetop, .pagetop a', ['color=#f2f2f2']],
  [
    '.titleline > a',
    ['font-family=Georgia, serif', 'font-size=15px', 'color=#1d1f23'],
  ],
];

/**
 * Starts `stylebot watch`, as an agent waiting for the user does, and
 * resolves once it prints its first line.
 */
const watch = env =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(rootDir, 'tools/cli/lib/cli.mjs'), 'watch'],
      { cwd: env.HOME, env }
    );
    child.stdout.once('data', () => resolve(child));
    child.once('error', reject);
  });

/**
 * The box of the terminal's element with an attribute, as CDP reads it, since
 * the terminal sits in a closed shadow root.
 */
const boxInTerminal = async (page, name, value) => {
  const session = await page.context().newCDPSession(page);
  const { root } = await session.send('DOM.getDocument', {
    depth: -1,
    pierce: true,
  });
  const find = node => {
    const attributes = node.attributes ?? [];
    for (let i = 0; i < attributes.length; i += 2) {
      if (attributes[i] === name && attributes[i + 1] === value) {
        return node;
      }
    }
    return [...(node.children ?? []), ...(node.shadowRoots ?? [])]
      .map(find)
      .find(Boolean);
  };
  const node = find(root);
  if (!node) {
    throw new Error(`No ${name}="${value}" in CLI mode's terminal`);
  }
  const { model } = await session.send('DOM.getBoxModel', {
    nodeId: node.nodeId,
  });
  await session.detach();
  const [left, top, , , right, bottom] = model.border;
  return { x: left, y: top, width: right - left, height: bottom - top };
};

const clickByTitle = async (page, title) => {
  const { x, y, width, height } = await boxInTerminal(page, 'title', title);
  await page.mouse.click(x + width / 2, y + height / 2);
};

/**
 * Marks the box around the first `count` elements matching a selector by
 * dragging over it, with some room around it.
 */
const mark = async (page, selector, count = 1) => {
  const first = await page.locator(selector).first().boundingBox();
  const last = await page
    .locator(selector)
    .nth(count - 1)
    .boundingBox();
  const pad = 4;
  await page.mouse.move(first.x - pad, first.y - pad);
  await page.mouse.down();
  await page.mouse.move(
    Math.max(first.x + first.width, last.x + last.width) + pad,
    last.y + last.height + pad,
    { steps: 8 }
  );
  await page.mouse.up();
  await wait(500);
};

// Narrower than the store's shots, so the terminal reads at the site's width.
const VIEWPORT = { width: 1120, height: 760 };

// Hides the page behind the terminal, which sits outside <body>, so the shot
// is the terminal alone on a transparent background.
const HIDE_PAGE = `
  html, body { background: none !important; }
  body { visibility: hidden !important; }
`;

/**
 * Makes the open terminal shorter by dragging its top edge down.
 */
const shorten = async (page, by) => {
  const box = await boxInTerminal(page, 'role', 'region');
  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + 1);
  await page.mouse.down();
  await page.mouse.move(x, box.y + 1 + by, { steps: 8 });
  await page.mouse.up();
  await wait(300);
};

/**
 * Saves the terminal alone, cut to its edges.
 */
const save = async (page, file) => {
  const clip = await boxInTerminal(page, 'role', 'region');
  const style = await page.addStyleTag({ content: HIDE_PAGE });
  const image = await page.screenshot({ clip, omitBackground: true });
  await style.evaluate(element => element.remove());
  await sharp(image).webp({ quality: 90 }).toFile(file);
  console.log(shownPath(file));
};

const USAGE = `usage: yarn capture:cli-mode [--out <dir>] [--no-build]

  --out <dir>  where to save the shots (default: captures/cli/)
  --no-build   skip the rebuild (dist must already be current)`;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}
const { outDir } = takeOutput(args, capturesDir('cli'));

if (!args.includes('--no-build')) {
  runOrExit(bin('yarn'), ['build']);
}

const browser = await startCliBrowser();
let watcher;

try {
  const page = await browser.context.newPage();
  await page.setViewportSize(VIEWPORT);
  await page.goto(URL, { waitUntil: 'load' });
  await page.bringToFront();
  await wait(1500);

  watcher = await watch(browser.env);
  await wait(2000);
  await save(page, path.join(outDir, 'connect.webp'));

  await clickByTitle(page, 'Connect this tab to your agent');
  await wait(1500);
  await shorten(page, 130);
  await mark(page, '#hnmain > tbody > tr:first-child');
  await mark(page, 'tr.athing, tr.athing + tr', 6);
  await page.keyboard.press('/');
  await page.keyboard.type(NOTE);
  await wait(800);
  await save(page, path.join(outDir, 'mark.webp'));

  await page.keyboard.press('Enter');
  await wait(1500);
  const { out: tabs } = await browser.cli(['tabs', '--json']);
  const tab = String(JSON.parse(tabs).find(entry => entry.url === URL).id);
  await browser.cli(['selection', tab]);
  for (const [selector, declarations] of RULES) {
    await browser.cli([
      'css',
      'rule',
      tab,
      selector,
      ...declarations.flatMap(declaration => ['--set', declaration]),
    ]);
  }
  await browser.cli([
    'screenshot',
    tab,
    '-o',
    path.join(browser.home, 'check.png'),
  ]);
  await browser.cli(['say', tab, REPLY]);
  // The terminal shows the agent running until 8s after its last command.
  await wait(9000);
  await save(page, path.join(outDir, 'reply.webp'));
} finally {
  watcher?.kill();
  await browser.close();
}
