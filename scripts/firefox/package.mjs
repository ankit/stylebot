// Builds the Firefox extension and packages what AMO asks for: the extension
// zip, and a zip of the source it was built from with build steps for reviewers.
//
//   yarn package:firefox

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import path from 'node:path';

import { requireReleaseTag } from '../stores/shared.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const outDir = path.join(root, 'release');

// Kept out of the source zip: store art and the Safari app aren't part of the
// Firefox build.
const EXCLUDED_FROM_SOURCE = ['store', 'safari'];

const AMO_MAX_JS_MB = 4;

/**
 * The JavaScript files in dir that are too large for AMO's linter to parse,
 * relative to dir.
 */
function findFilesTooLargeForAMO(dir) {
  return readdirSync(dir, { recursive: true })
    .filter(file => file.endsWith('.js'))
    .filter(
      file => statSync(path.join(dir, file)).size > AMO_MAX_JS_MB * 2 ** 20
    );
}

/**
 * Runs a command in the repo root, printing its output.
 */
function run(command, args, options = {}) {
  execFileSync(command, args, { cwd: root, stdio: 'inherit', ...options });
}

/**
 * The build steps AMO reviewers follow to rebuild the extension from source.
 */
function getBuildInstructions(version, clientSecret) {
  const nodeVersion = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();

  return `# Building Stylebot ${version} for Firefox

Requirements: Node.js ${nodeVersion} and Yarn 1 (classic). Any OS with a POSIX shell.

1. \`yarn install --frozen-lockfile\`
2. \`STYLEBOT_GOOGLE_CLIENT_SECRET=${clientSecret} yarn build:firefox\`

The built extension is written to \`firefox-dist/\`, which matches the uploaded
package. The variable is the secret of Stylebot's Google sign-in client for
installed apps, which Google treats as public since it ships in the package;
it's kept out of the repository only. No network access beyond the npm
registry is needed.

## Notes for reviewers

Stylebot has no server and no analytics. It only talks to these, and only
when the user turns the feature on:

- **Sync** signs in with Google through \`identity\` and stores styles in the
  user's own Google Drive, with the \`drive.file\` scope, so it only sees files
  it created.
- **Google Fonts**: when the user picks a web font in the editor, the font
  is loaded from Google Fonts.

All code ships in the package; nothing is loaded remotely. The privacy policy
is at https://stylebot.dev/privacy.
`;
}

const status = execFileSync('git', ['status', '--porcelain'], {
  cwd: root,
  encoding: 'utf8',
});

if (status.trim()) {
  console.error(
    'Commit or set aside your changes first: the source zip is made from the ' +
      'last commit, so it has to match what gets built.'
  );
  process.exit(1);
}

const clientSecret = process.env.STYLEBOT_GOOGLE_CLIENT_SECRET;

if (!clientSecret) {
  console.error(
    'Set STYLEBOT_GOOGLE_CLIENT_SECRET to the Desktop OAuth client secret; ' +
      'Google Drive sign-in needs it.'
  );
  process.exit(1);
}

const { version } = JSON.parse(
  readFileSync(path.join(root, 'package.json'), 'utf8')
);
try {
  requireReleaseTag(version);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const extensionZip = path.join(outDir, `stylebot-${version}-firefox.zip`);
const sourceZip = path.join(outDir, `stylebot-${version}-source.zip`);

mkdirSync(outDir, { recursive: true });
rmSync(extensionZip, { force: true });
rmSync(sourceZip, { force: true });

run('yarn', ['build:firefox']);

const tooLarge = findFilesTooLargeForAMO(path.join(root, 'firefox-dist'));

if (tooLarge.length) {
  console.error(
    `AMO's linter can't parse JavaScript files over ${AMO_MAX_JS_MB} MB, so ` +
      `it would reject the upload:\n  ${tooLarge.join('\n  ')}`
  );
  process.exit(1);
}

run('zip', ['-r', '-X', '-q', extensionZip, '.', '-x', '.build-complete'], {
  cwd: path.join(root, 'firefox-dist'),
});

run('git', [
  'archive',
  '--format=zip',
  `--add-virtual-file=AMO-BUILD.md:${getBuildInstructions(
    version,
    clientSecret
  )}`,
  '-o',
  sourceZip,
  'HEAD',
  '--',
  '.',
  ...EXCLUDED_FROM_SOURCE.map(dir => `:(exclude)${dir}`),
]);

console.log(`\nUpload to AMO:\n  ${extensionZip}\n  ${sourceZip} (source)`);
