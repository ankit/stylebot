// Shared helpers for the store upload scripts.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { bin, rootDir, runOrExit } from '../lib/cli.mjs';

export const releaseDir = path.join(rootDir, 'release');

/**
 * Reads the named variables from the environment, throwing with the list of
 * missing ones if any aren't set.
 */
export const requireEnv = names => {
  const missing = names.filter(name => !process.env[name]);

  if (missing.length) {
    throw new Error(`Set ${missing.join(', ')}; see docs/releases.md.`);
  }

  return Object.fromEntries(names.map(name => [name, process.env[name]]));
};

/**
 * Parses a JSON response, throwing with the body when the request failed.
 */
export const readJson = async (response, what) => {
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${what} failed (${response.status}): ${text}`);
  }

  return text ? JSON.parse(text) : {};
};

/**
 * Calls check every few seconds until it returns true, for up to 10 minutes.
 */
export const poll = async (store, check) => {
  const deadline = Date.now() + 10 * 60 * 1000;

  while (Date.now() < deadline) {
    if (await check()) {
      return;
    }

    await sleep(5000);
  }

  throw new Error(`${store} is still processing the upload; check it there.`);
};

const git = args =>
  execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' }).trim();

/**
 * Throws unless HEAD is the release's vX.Y.Z tag, which the release workflow
 * puts on the merged release commit, so a store only gets released code.
 */
export const requireReleaseTag = version => {
  const tag = `v${version}`;

  if (!git(['tag', '--points-at', 'HEAD']).split('\n').includes(tag)) {
    throw new Error(
      `HEAD isn't ${tag}. Run \`git fetch origin --tags && git checkout ${tag}\` ` +
        'first, so the store gets the merged release commit.'
    );
  }
};

/**
 * Checks what's uploaded is the release's tagged commit, along with the build
 * secret and the store's credentials, and returns the version being released.
 */
export const prepareUpload = envNames => {
  if (git(['status', '--porcelain'])) {
    throw new Error(
      'Commit or set aside your changes first, so what gets uploaded matches a commit.'
    );
  }

  requireEnv(['STYLEBOT_GOOGLE_CLIENT_SECRET', ...envNames]);

  const { version } = JSON.parse(
    readFileSync(path.join(rootDir, 'package.json'), 'utf8')
  );

  requireReleaseTag(version);

  return version;
};

/**
 * The zip Chrome and Edge share, built once per commit: named by it, so
 * uploading to the second store reuses the first one's.
 */
export const packageChromium = version => {
  const commit = git(['rev-parse', '--short', 'HEAD']);
  const zipPath = path.join(releaseDir, `stylebot-${version}-${commit}.zip`);

  if (existsSync(zipPath)) {
    console.log(`Reusing ${path.relative(rootDir, zipPath)}`);

    return zipPath;
  }

  const partialPath = `${zipPath}.partial`;

  mkdirSync(releaseDir, { recursive: true });
  rmSync(partialPath, { force: true });
  runOrExit(bin('yarn'), ['build']);
  execFileSync(
    'zip',
    ['-r', '-X', '-q', partialPath, '.', '-x', '.build-complete'],
    { cwd: path.join(rootDir, 'dist'), stdio: 'inherit' }
  );
  renameSync(partialPath, zipPath);

  return zipPath;
};

/**
 * Runs a store's upload, printing where to find it or why it failed.
 */
export const runUpload = async upload => {
  try {
    console.log(`\n${await upload()}`);
  } catch (error) {
    console.error(`\n${error.message}`);
    process.exit(1);
  }
};
