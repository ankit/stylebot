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
