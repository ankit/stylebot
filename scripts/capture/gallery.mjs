// Takes the stylebot.dev gallery's screenshots from the current build, on live
// sites, applying each theme in the site repo's gallery, into
// captures/gallery/<site>/:
//
//   yarn capture:gallery [<site>[/<theme>]...] [--themes <dir>] [--out <dir>] [--no-build]

import fs from 'node:fs';
import path from 'node:path';

import { bin, runOrExit } from '../lib/cli.mjs';
import { launch, seed, style, wait } from './browser.mjs';
import { capturesDir, shownPath, takeOutput } from './output.mjs';
import { takeThemes } from './themes.mjs';

// The page each site's themes are shown on. NYTimes blocks headless Chrome and
// Gmail needs a sign-in, so their shots are still taken by hand.
const PAGES = {
  github: 'https://github.com/ankit/stylebot',
  hn: 'https://news.ycombinator.com/',
  wikipedia: 'https://en.wikipedia.org/wiki/Valheim',
};

const VIEWPORT = { width: 1440, height: 900 };

const args = process.argv.slice(2);
const help = args.includes('--help') || args.includes('-h');
const { themesDir, rest: themeArgs } = takeThemes(args);

const themes = fs
  .readdirSync(themesDir)
  .filter(site => PAGES[site])
  .flatMap(site =>
    fs
      .readdirSync(path.join(themesDir, site))
      .filter(file => file.endsWith('.css'))
      .map(file => `${site}/${path.basename(file, '.css')}`)
  );

const USAGE = `usage: yarn capture:gallery [<site>[/<theme>]...] [--themes <dir>] [--out <dir>] [--no-build]

  --themes    read the themes from this gallery directory instead of
              ../stylebot-site/src/assets/gallery
  --out       save into this directory instead of captures/gallery/; the
              gallery directory itself puts each image beside its CSS
  --no-build  skip the rebuild (dist must already be current)

With no names, retakes every theme below.

Themes:
${themes.map(theme => `  ${theme}`).join('\n')}
`;

if (help) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const { outDir, rest } = takeOutput(themeArgs, capturesDir('gallery'));
const wanted = rest.filter(arg => !arg.startsWith('--'));
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
  const css = fs.readFileSync(path.join(themesDir, `${theme}.css`), 'utf8');
  const browser = await launch({ appearance: 'light' });

  try {
    await seed(browser, { styles: { [new URL(url).hostname]: style(css) } });
    const page = await browser.context.newPage();
    await page.setViewportSize(VIEWPORT);
    await page.goto(url, { waitUntil: 'load' });
    await page.mouse.move(0, 0);
    await wait(2500);
    fs.mkdirSync(path.join(outDir, site), { recursive: true });
    await page.screenshot({ path: path.join(outDir, `${theme}.png`) });
    console.log(`✓ ${theme}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${theme}: ${error.message.split('\n')[0]}`);
  } finally {
    await browser.close();
  }
}

console.log(`\nSaved to ${shownPath(outDir)}/`);
process.exit(failed ? 1 : 0);
