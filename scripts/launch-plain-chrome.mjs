// Launches a plain Chrome — no debugging port, no automation flags — on the
// dev profile, for flows Google's sign-in refuses in any browser that is being
// debugged ("This browser or app may not be secure"), which blocks testing
// Google Drive sync in `yarn dev:chrome`.
//
// Chrome keeps extensions loaded by hand through chrome://extensions in the
// profile, but purges ones loaded over CDP (as `yarn dev:chrome` does) on the
// next launch, and the native folder picker cannot be scripted. So the first
// run opens chrome://extensions for a one-time "Load unpacked"; every later
// run goes straight to the test page. No hot reload here: press ↻ on
// chrome://extensions after a rebuild.

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const extensionPath = path.join(rootDir, 'dist');
const userDataDir = path.join(rootDir, '.chrome-dev-profile');
const startUrl = 'https://news.ycombinator.com';

const CHROME_PATHS = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: 'google-chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
};
const chromePath =
  process.env.STYLEBOT_BROWSER_PATH ?? CHROME_PATHS[process.platform];

const readJson = file => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

const manifest = readJson(path.join(extensionPath, 'manifest.json'));

if (!manifest) {
  console.error(
    '❌ No build in dist/ — run `yarn build:dev` or `yarn watch` first.'
  );
  process.exit(1);
}

// Only development builds carry the store's public key (see webpack.config.js);
// without it the extension id differs from the one the OAuth client knows.
if (!manifest.key) {
  console.warn(
    '⚠️  dist/manifest.json has no `key`, so Google sign-in will fail with redirect_uri_mismatch.\n   Add .extension-key (README, "Google Drive Sync") and rebuild with `yarn build:dev`.'
  );
}

// Chrome records unpacked extensions in Secure Preferences (Preferences on
// some platforms) as location 4 with the directory they were loaded from. A
// CDP-loaded one from `yarn dev:chrome` looks the same until Chrome purges it
// at startup, so this can only say "possibly installed", never "installed".
const hasUnpackedEntry = () =>
  ['Secure Preferences', 'Preferences'].some(file => {
    const settings =
      readJson(path.join(userDataDir, 'Default', file))?.extensions?.settings ??
      {};
    return Object.values(settings).some(
      entry => entry?.location === 4 && entry?.path === extensionPath
    );
  });

mkdirSync(userDataDir, { recursive: true });

if (process.platform === 'darwin') {
  spawn('pbcopy', { stdio: ['pipe', 'ignore', 'ignore'] }).stdin.end(
    extensionPath
  );
}

const urls = hasUnpackedEntry()
  ? [startUrl]
  : ['chrome://extensions', startUrl];

const chrome = spawn(
  chromePath,
  [
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--start-maximized',
    ...urls,
  ],
  { stdio: 'ignore' }
);

console.log(
  `\n🎉 Plain Chrome launched — no debugging port, so Google sign-in works.`
);
console.log(
  `📦 If chrome://extensions shows no Stylebot card: turn on Developer mode → Load unpacked → pick\n   ${extensionPath}${
    process.platform === 'darwin'
      ? '\n   (on the clipboard — press ⌘⇧G in the file dialog and paste)'
      : ''
  }\n   It stays in this profile, so later launches skip this step.`
);
console.log(
  '🔌 No hot reload: after a rebuild, press ↻ on chrome://extensions and refresh the tab.'
);
console.log('🪟 Close the browser window to exit.\n');

await new Promise(resolve => chrome.on('exit', resolve));
