// CLI mode as someone uses it on Hacker News: the real CLI connects the tab,
// two areas are marked and noted, and the agent answers with a change.

import { spawn } from 'node:child_process';
import path from 'node:path';

import { rootDir } from '../lib/cli.mjs';
import { wait } from './browser.mjs';

export const URL = 'https://news.ycombinator.com/';
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
export const boxInTerminal = async (page, name, value) => {
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

// Hides the page behind the terminal, which sits outside <body>, so a shot of
// it is the terminal alone on a transparent background.
const HIDE_PAGE = `
  html, body { background: none !important; }
  body { visibility: hidden !important; }
`;

/**
 * The terminal alone, cut to its edges, on a transparent background.
 */
export const terminalImage = async page => {
  const clip = await boxInTerminal(page, 'role', 'region');
  const style = await page.addStyleTag({ content: HIDE_PAGE });
  const image = await page.screenshot({ clip, omitBackground: true });
  await style.evaluate(element => element.remove());
  return image;
};

/**
 * Runs CLI mode on a page already open at URL, calling `at` with the name of
 * each moment worth a screenshot: connect, mark and reply. `note` and
 * `reply` change what the terminal says, for a shot of it over another page.
 */
export const runCliMode = async (
  browser,
  page,
  at = async () => {},
  { note = NOTE, reply = REPLY } = {}
) => {
  const watcher = await watch(browser.env);

  try {
    await wait(2000);
    await at('connect');

    await clickByTitle(page, 'Connect this tab to your agent');
    await wait(1500);
    await shorten(page, 130);
    await mark(page, '#hnmain > tbody > tr:first-child');
    await mark(page, 'tr.athing, tr.athing + tr', 6);
    await page.keyboard.press('/');
    await page.keyboard.type(note);
    await wait(800);
    await at('mark');

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
    await browser.cli(['say', tab, reply]);
    // The terminal shows the agent running until 8s after its last command.
    await wait(9000);
    await at('reply');
  } finally {
    watcher.kill();
  }
};
