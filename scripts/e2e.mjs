// One entry point for the Playwright e2e suite across browsers and modes:
//
//   yarn e2e [--edge | --firefox] [--headed | --ui | --debug] [--no-build] [playwright args]
//
// Picks the right build (dist/ vs firefox-dist/), sets STYLEBOT_BROWSER for
// e2e/fixtures.ts, and runs --headed/--debug on a single worker so only one
// browser window opens. Anything unrecognized is passed through to `playwright test`.

import { spawnSync } from 'node:child_process';

const USAGE = `usage: yarn e2e [--edge | --firefox] [--headed | --ui | --debug] [--no-build] [playwright test args]

  (default)   Chrome, headless — what CI runs
  --edge      Microsoft Edge (same dist/ build as Chrome)
  --firefox   Firefox (firefox-dist/ build; popup-driven specs are skipped)

  --headed    real browser window, one worker
  --ui        Playwright UI mode
  --debug     Playwright inspector, one worker
  --no-build  skip the rebuild (dist must already be current)
`;

const flags = new Set();
const passthrough = [];

for (const arg of process.argv.slice(2)) {
  if (
    [
      '--edge',
      '--firefox',
      '--headed',
      '--ui',
      '--debug',
      '--no-build',
    ].includes(arg)
  ) {
    flags.add(arg);
  } else if (arg === '--help' || arg === '-h') {
    process.stdout.write(USAGE);
    process.exit(0);
  } else {
    passthrough.push(arg);
  }
}

if (flags.has('--edge') && flags.has('--firefox')) {
  console.error('Pick one of --edge or --firefox.');
  process.exit(1);
}

let browser = 'chrome';
if (flags.has('--firefox')) {
  browser = 'firefox';
} else if (flags.has('--edge')) {
  browser = 'edge';
}

const run = (command, args) => {
  const { status } = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, STYLEBOT_BROWSER: browser },
  });
  if (status !== 0) {
    process.exit(status ?? 1);
  }
};

if (!flags.has('--no-build')) {
  run('yarn', [browser === 'firefox' ? 'build:firefox' : 'build']);
}

const playwrightArgs = ['test'];
if (flags.has('--ui')) {
  playwrightArgs.push('--ui');
}
if (flags.has('--headed')) {
  playwrightArgs.push('--headed', '--workers=1');
}
if (flags.has('--debug')) {
  playwrightArgs.push('--debug', '--workers=1');
}

run('node_modules/.bin/playwright', [...playwrightArgs, ...passthrough]);
