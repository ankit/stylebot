// Launches the extension in Firefox via `web-ext run`.
//
// web-ext's own default binary lookup on macOS looks for
// Firefox.app/Contents/MacOS/firefox-bin, a symlink that Firefox stopped
// shipping around version 118 (2023) — so on any current macOS install,
// letting web-ext find Firefox itself fails with ENOENT. Resolve the real
// binary ourselves and pass it explicitly; web-ext's own lookup still works
// fine on Linux/Windows, so leave those to it.

import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const macFirefoxCandidates = [
  '/Applications/Firefox.app/Contents/MacOS/firefox',
  path.join(
    process.env.HOME ?? '',
    'Applications/Firefox.app/Contents/MacOS/firefox'
  ),
];

const firefoxBinary =
  process.platform === 'darwin'
    ? macFirefoxCandidates.find(existsSync)
    : undefined;

const webExtBin = path.join(
  rootDir,
  'node_modules/.bin',
  process.platform === 'win32' ? 'web-ext.cmd' : 'web-ext'
);

const args = ['run', '--source-dir', './firefox-dist/'];
if (firefoxBinary) {
  args.push('--firefox', firefoxBinary);
}

const child = spawn(webExtBin, args, { stdio: 'inherit', cwd: rootDir });
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
