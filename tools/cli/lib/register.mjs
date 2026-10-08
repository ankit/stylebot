import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  HOST_DIR,
  HOST_LAUNCHER_PATH,
  HOST_NAME,
  IS_WINDOWS,
  STATE_DIR,
} from './paths.mjs';

const { join, dirname } = IS_WINDOWS ? path.win32 : path.posix;

// What each store assigns Stylebot; Chrome's comes from the public key dev builds carry too.
const EXTENSION_IDS = [
  'oiaejidbmkiecgbjeifoejpgmdaleoha',
  'mjolbpfednnbebfapicajpifliopnnai',
];

/*
 * Each browser's user data folder: under ~/Library/Application Support on
 * macOS, ~/.config on Linux and %LOCALAPPDATA% on Windows, where its native
 * hosts are registered under an HKCU key instead.
 */
export const BROWSERS = [
  {
    name: 'Chrome',
    darwin: 'Google/Chrome',
    linux: 'google-chrome',
    win32: 'Google\\Chrome\\User Data',
    key: 'Google\\Chrome',
  },
  {
    name: 'Edge',
    darwin: 'Microsoft Edge',
    linux: 'microsoft-edge',
    win32: 'Microsoft\\Edge\\User Data',
    key: 'Microsoft\\Edge',
  },
  {
    name: 'Brave',
    darwin: 'BraveSoftware/Brave-Browser',
    linux: 'BraveSoftware/Brave-Browser',
    win32: 'BraveSoftware\\Brave-Browser\\User Data',
    // Brave reads Chrome's hosts on macOS, and Chromium's or Chrome's key on Windows.
    darwinHosts: 'Google/Chrome',
    key: 'Google\\Chrome',
  },
  {
    name: 'Chromium',
    darwin: 'Chromium',
    linux: 'chromium',
    win32: 'Chromium\\User Data',
    key: 'Chromium',
  },
  {
    name: 'Vivaldi',
    darwin: 'Vivaldi',
    linux: 'vivaldi',
    win32: 'Vivaldi\\User Data',
    key: 'Google\\Chrome',
  },
  { name: 'Arc', darwin: 'Arc/User Data' },
];

/**
 * The Stylebot checkout the current directory is in, whose dev profiles
 * `yarn dev:chrome` launches with, or undefined outside one.
 */
const findCheckout = () => {
  for (let dir = process.cwd(); ; dir = dirname(dir)) {
    if (
      fs.existsSync(join(dir, 'src', 'assets', 'manifest', 'manifest-dev.json'))
    ) {
      return dir;
    }

    if (dir === dirname(dir)) {
      return undefined;
    }
  }
};

/**
 * The checkout's dev profiles, which read native hosts from their own
 * folder on macOS and Linux.
 */
const devProfileDirs = () => {
  const checkout = findCheckout();

  if (!checkout) {
    return [];
  }

  const names = fs
    .readdirSync(checkout)
    .filter(name => /^\.(chrome|edge)-dev-profile/.test(name));

  if (!names.includes('.chrome-dev-profile')) {
    names.push('.chrome-dev-profile');
  }

  return names.map(name => join(checkout, name));
};

/**
 * The installed browsers on this platform, with the folder their native
 * hosts go in (or, on Windows, their user data folder).
 */
const installedBrowsers = () => {
  const platform = os.platform();
  const home = os.homedir();
  const root = {
    darwin: join(home, 'Library', 'Application Support'),
    linux: join(home, '.config'),
    win32: process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'),
  }[platform];

  return BROWSERS.filter(
    browser =>
      root && browser[platform] && fs.existsSync(join(root, browser[platform]))
  ).map(browser => ({
    ...browser,
    dir: join(
      root,
      (platform === 'darwin' && browser.darwinHosts) || browser[platform]
    ),
  }));
};

/**
 * Writes the launcher the browser starts the host with, pinned to this
 * node because browsers start it without the shell's PATH.
 */
const writeLauncher = () => {
  const host = join(HOST_DIR, 'host.mjs');

  if (IS_WINDOWS) {
    fs.writeFileSync(
      HOST_LAUNCHER_PATH,
      `@echo off\r\n"${process.execPath}" "${host}"\r\n`
    );
  } else {
    fs.writeFileSync(
      HOST_LAUNCHER_PATH,
      `#!/bin/sh\nexec "${process.execPath}" "${host}"\n`,
      { mode: 0o755 }
    );
  }
};

/**
 * Writes the host manifest into a folder, returning its path.
 */
const writeManifest = dir => {
  const manifest = {
    name: HOST_NAME,
    description: 'Stylebot CLI',
    path: HOST_LAUNCHER_PATH,
    type: 'stdio',
    allowed_origins: EXTENSION_IDS.map(id => `chrome-extension://${id}/`),
  };
  const file = join(dir, `${HOST_NAME}.json`);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);

  return file;
};

/**
 * Registers the host copied into HOST_DIR with the checkout's dev profiles
 * and every installed browser, returning where, per browser.
 */
export const registerHost = () => {
  writeLauncher();

  if (IS_WINDOWS) {
    const manifest = writeManifest(STATE_DIR);

    const registrations = installedBrowsers().map(browser => ({
      browser: browser.name,
      location: `HKCU\\Software\\${browser.key}\\NativeMessagingHosts\\${HOST_NAME}`,
    }));

    for (const key of new Set(registrations.map(r => r.location))) {
      execFileSync('reg', ['add', key, '/ve', '/d', manifest, '/f'], {
        stdio: 'ignore',
      });
    }

    return registrations;
  }

  return [
    ...devProfileDirs().map(dir => ({ name: 'Dev profile', dir })),
    ...installedBrowsers(),
  ].map(({ name, dir }) => {
    const location = join(dir, 'NativeMessagingHosts');

    writeManifest(location);
    return { browser: name, location };
  });
};

/**
 * What `stylebot install` prints for the registrations made.
 */
export const describeRegistrations = registrations => {
  const width = Math.max(...registrations.map(r => r.browser.length));
  const lines = registrations.length
    ? [
        'Registered the native host with:',
        ...registrations.map(
          ({ browser, location }) => `  ${browser.padEnd(width)}  ${location}`
        ),
      ]
    : [];

  if (!registrations.some(r => r.browser !== 'Dev profile')) {
    const names = BROWSERS.filter(browser => browser[os.platform()]).map(
      browser => browser.name
    );

    lines.push(
      `No supported browser found (${names.join(
        ', '
      )}). Install one, then run \`stylebot install\` again.`
    );
  }

  return lines.join('\n');
};
