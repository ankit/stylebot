// Takes the stylebot.dev gallery's screenshots from the current build, on live
// sites, next to each theme's CSS in site/src/assets/gallery/:
//
//   yarn capture:gallery [<site>[/<theme>]...] [--no-build]

import fs from 'node:fs';
import path from 'node:path';

import { bin, rootDir, runOrExit } from '../lib/cli.mjs';
import { launch, seed, style, wait } from './browser.mjs';

const GALLERY_DIR = path.join(rootDir, 'site/src/assets/gallery');

// The page each site's themes are shown on. NYTimes blocks headless Chrome and
// Gmail needs a sign-in, so their shots are still taken by hand.
const PAGES = {
  github: 'https://github.com/ankit/stylebot',
  hn: 'https://news.ycombinator.com/',
  wikipedia: 'https://en.wikipedia.org/wiki/Valheim',
};

const VIEWPORT = { width: 1440, height: 900 };

const themes = fs
  .readdirSync(GALLERY_DIR)
  .filter(site => PAGES[site])
  .flatMap(site =>
    fs
      .readdirSync(path.join(GALLERY_DIR, site))
      .filter(file => file.endsWith('.css'))
      .map(file => `${site}/${path.basename(file, '.css')}`)
  );

const USAGE = `usage: yarn capture:gallery [<site>[/<theme>]...] [--no-build]

  --no-build  skip the rebuild (dist must already be current)

With no names, retakes every theme below.

Themes:
${themes.map(theme => `  ${theme}`).join('\n')}
`;

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const wanted = args.filter(arg => !arg.startsWith('--'));
const shots = wanted.length
  ? themes.filter(theme =>
      wanted.some(name => theme === name || theme.startsWith(`${name}/`))
    )
  : themes;

if (!shots.length) {
  console.error(`No theme named ${wanted.join(', ')}.\n\n${USAGE}`);
  process.exit(1);
}

if (!args.includes('--no-build')) {
  runOrExit(bin('yarn'), ['build']);
}

let failed = 0;

for (const theme of shots) {
  const [site] = theme.split('/');
  const url = PAGES[site];
  const css = fs.readFileSync(path.join(GALLERY_DIR, `${theme}.css`), 'utf8');
  const browser = await launch({ appearance: 'light' });

  try {
    await seed(browser, { styles: { [new URL(url).hostname]: style(css) } });
    const page = await browser.context.newPage();
    await page.setViewportSize(VIEWPORT);
    await page.goto(url, { waitUntil: 'load' });
    await page.mouse.move(0, 0);
    await wait(2500);
    await page.screenshot({ path: path.join(GALLERY_DIR, `${theme}.png`) });
    console.log(`✓ ${theme}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${theme}: ${error.message.split('\n')[0]}`);
  } finally {
    await browser.close();
  }
}

console.log(`\nSaved to ${path.relative(rootDir, GALLERY_DIR)}/`);
process.exit(failed ? 1 : 0);
