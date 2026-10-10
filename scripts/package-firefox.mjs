// Builds the Firefox extension and packages what AMO asks for: the extension
// zip, and a zip of the source it was built from with build steps for reviewers.
//
//   yarn package:firefox

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'release');

// Kept out of the source zip: the website, store art and the Safari app aren't
// part of the Firefox build.
const EXCLUDED_FROM_SOURCE = ['site', 'store', 'safari'];

/**
 * Runs a command in the repo root, printing its output.
 */
function run(command, args, options = {}) {
  execFileSync(command, args, { cwd: root, stdio: 'inherit', ...options });
}

/**
 * The build steps AMO reviewers follow to rebuild the extension from source.
 */
function getBuildInstructions(version) {
  const nodeVersion = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();

  return `# Building Stylebot ${version} for Firefox

Requirements: Node.js ${nodeVersion} and Yarn 1 (classic). Any OS with a POSIX shell.

1. \`yarn install --frozen-lockfile\`
2. \`yarn build:firefox\`

The built extension is written to \`firefox-dist/\`, which matches the uploaded
package. No environment variables or network access beyond the npm registry
are needed.

## Notes for reviewers

Stylebot has no server and no analytics. It only talks to these, and only
when the user turns the feature on:

- **Chat** sends the user's message, the page's address and title, an
  outline of the page, its CSS and any attached screenshot straight to the AI
  provider they pick (Anthropic, OpenAI or Google), using an API key they
  paste into Stylebot. Without a key Chat only asks for one; to try it, open
  the editor's Chat tab, choose "Here in Chat" and paste a key of your own.
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

const { version } = JSON.parse(
  readFileSync(path.join(root, 'package.json'), 'utf8')
);
const extensionZip = path.join(outDir, `stylebot-${version}-firefox.zip`);
const sourceZip = path.join(outDir, `stylebot-${version}-source.zip`);

mkdirSync(outDir, { recursive: true });
rmSync(extensionZip, { force: true });
rmSync(sourceZip, { force: true });

run('yarn', ['build:firefox']);
run('zip', ['-r', '-X', '-q', extensionZip, '.', '-x', '.build-complete'], {
  cwd: path.join(root, 'firefox-dist'),
});

run('git', [
  'archive',
  '--format=zip',
  `--add-virtual-file=AMO-BUILD.md:${getBuildInstructions(version)}`,
  '-o',
  sourceZip,
  'HEAD',
  '--',
  '.',
  ...EXCLUDED_FROM_SOURCE.map(dir => `:(exclude)${dir}`),
]);

console.log(`\nUpload to AMO:\n  ${extensionZip}\n  ${sourceZip} (source)`);
