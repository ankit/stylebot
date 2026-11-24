// Takes the stylebot.dev command line page's screenshots of CLI mode from the
// current build into captures/cli/, cut to the terminal: the real CLI
// connects Hacker News, marks two areas, sends a note about them and answers
// it with a change.
//
//   yarn capture:cli-mode [--out <dir>] [--no-build]

import path from 'node:path';

import { bin, runOrExit } from '../lib/cli.mjs';
import { sharp, wait } from './browser.mjs';
import { URL, runCliMode, terminalImage } from './cli-mode-steps.mjs';
import { startCliBrowser } from './cli-shot.mjs';
import { capturesDir, shownPath, takeOutput } from './output.mjs';

// Narrower than the store's shots, so the terminal reads at the site's width.
const VIEWPORT = { width: 1120, height: 760 };

/**
 * Saves the terminal alone, cut to its edges.
 */
const save = async (page, file) => {
  await sharp(await terminalImage(page))
    .webp({ quality: 90 })
    .toFile(file);
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

try {
  const page = await browser.context.newPage();
  await page.setViewportSize(VIEWPORT);
  await page.goto(URL, { waitUntil: 'load' });
  await page.bringToFront();
  await wait(1500);

  await runCliMode(browser, page, moment =>
    save(page, path.join(outDir, `${moment}.webp`))
  );
} finally {
  await browser.close();
}
