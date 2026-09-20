// Shared plumbing for the yarn entry points under scripts/.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

// Windows has no bare `yarn`/`playwright` executables, only .cmd shims.
export const bin = name =>
  process.platform === 'win32' ? `${name}.cmd` : name;

export const localBin = name =>
  path.join(rootDir, 'node_modules', '.bin', bin(name));

/**
 * Runs a command from the repo root with inherited stdio and returns its
 * exit status.
 */
export const run = (command, args, env = {}) =>
  spawnSync(command, args, {
    stdio: 'inherit',
    cwd: rootDir,
    env: { ...process.env, ...env },
  }).status ?? 1;

/**
 * Like run, but ends the process on failure.
 */
export const runOrExit = (command, args, env) => {
  const status = run(command, args, env);
  if (status !== 0) {
    process.exit(status);
  }
};
