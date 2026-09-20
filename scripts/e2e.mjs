// One entry point for the Playwright e2e suite across browsers and modes:
//
//   yarn e2e [--edge | --firefox] [--headed | --ui | --debug] [--no-build] [playwright args]
//
// Picks the right build (dist/ vs firefox-dist/), sets STYLEBOT_BROWSER for
// e2e/fixtures.ts, and runs --headed on a single worker so only one browser
// window opens. Everything else is passed through to `playwright test`.

import { bin, localBin, runOrExit } from './lib/cli.mjs';

const USAGE = `usage: yarn e2e [--edge | --firefox] [--headed | --ui | --debug] [--no-build] [playwright test args]

  (default)   Chrome, headless — what CI runs
  --edge      Microsoft Edge (same dist/ build as Chrome)
  --firefox   Firefox (firefox-dist/ build)

  --headed    real browser window, one worker
  --ui        Playwright UI mode
  --debug     Playwright inspector, one worker
  --no-build  skip the rebuild (dist must already be current)
`;

const OWN_FLAGS = ['--edge', '--firefox', '--no-build'];
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

if (args.includes('--edge') && args.includes('--firefox')) {
  console.error('Pick one of --edge or --firefox.');
  process.exit(1);
}

let browser = 'chrome';
if (args.includes('--firefox')) {
  browser = 'firefox';
} else if (args.includes('--edge')) {
  browser = 'edge';
}

const run = (command, commandArgs) =>
  runOrExit(command, commandArgs, { STYLEBOT_BROWSER: browser });

if (!args.includes('--no-build')) {
  run(bin('yarn'), [browser === 'firefox' ? 'build:firefox' : 'build']);
}

const playwrightArgs = args.filter(arg => !OWN_FLAGS.includes(arg));
// --debug already implies a single worker; --headed doesn't, and four windows
// opening at once is not what anyone asking for a headed run wants.
if (args.includes('--headed')) {
  playwrightArgs.push('--workers=1');
}

run(localBin('playwright'), ['test', ...playwrightArgs]);
