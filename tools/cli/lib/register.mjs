import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  HOST_DIR,
  HOST_LAUNCHER_PATH,
  HOST_NAME,
  IS_WINDOWS,
} from './paths.mjs';
import { CHROMIUM } from './engines/chromium.mjs';
import { FIREFOX } from './engines/firefox.mjs';

const { join, dirname } = IS_WINDOWS ? path.win32 : path.posix;

// What differs between Chromium browsers and Firefox lives in their engine.
const ENGINES = [CHROMIUM, FIREFOX];

/*
 * Each browser's user data folder per platform, as its engine reads it, and
 * on Windows the HKCU key it reads native hosts from.
 */
export const BROWSERS = [
  {
    name: 'Chrome',
    engine: CHROMIUM,
    darwin: 'Google/Chrome',
    linux: 'google-chrome',
    win32: 'Google\\Chrome\\User Data',
    key: 'Google\\Chrome',
  },
  {
    name: 'Firefox',
    engine: FIREFOX,
    darwin: 'Firefox',
    linux: '.mozilla/firefox',
    win32: 'Mozilla\\Firefox',
    key: 'Mozilla',
  },
  {
    name: 'Edge',
    engine: CHROMIUM,
    darwin: 'Microsoft Edge',
    linux: 'microsoft-edge',
    win32: 'Microsoft\\Edge\\User Data',
    key: 'Microsoft\\Edge',
  },
  {
    name: 'Brave',
    engine: CHROMIUM,
    darwin: 'BraveSoftware/Brave-Browser',
    linux: 'BraveSoftware/Brave-Browser',
    win32: 'BraveSoftware\\Brave-Browser\\User Data',
    // Brave reads Chrome's hosts on macOS, and Chromium's or Chrome's key on Windows.
    darwinHosts: 'Google/Chrome',
    key: 'Google\\Chrome',
  },
  {
    name: 'Chromium',
    engine: CHROMIUM,
    darwin: 'Chromium',
    linux: 'chromium',
    win32: 'Chromium\\User Data',
    key: 'Chromium',
  },
  {
    name: 'Vivaldi',
    engine: CHROMIUM,
    darwin: 'Vivaldi',
    linux: 'vivaldi',
    win32: 'Vivaldi\\User Data',
    key: 'Google\\Chrome',
  },
  { name: 'Arc', engine: CHROMIUM, darwin: 'Arc/User Data' },
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
 * Each installed copy of the browsers on this platform, with its user data
 * folder and the folder its native hosts go in (unused on Windows).
 */
const installedBrowsers = () =>
  BROWSERS.filter(browser => browser[os.platform()]).flatMap(browser =>
    browser.engine.installs(browser).map(dirs => ({ ...browser, ...dirs }))
  );

/**
 * Writes the launcher the browser starts the host with, pinned to this
 * node because browsers start it without the shell's PATH.
 */
export const writeLauncher = () => {
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
 * The node the launcher is pinned to, or undefined without a launcher.
 */
export const launcherNode = () => {
  if (!fs.existsSync(HOST_LAUNCHER_PATH)) {
    return undefined;
  }

  return fs.readFileSync(HOST_LAUNCHER_PATH, 'utf8').match(/"([^"]+)"/)?.[1];
};

/**
 * Writes the host manifest for an engine into a folder, returning its path.
 */
const writeManifest = (dir, engine) => {
  const manifest = {
    name: HOST_NAME,
    description: 'Stylebot CLI',
    path: HOST_LAUNCHER_PATH,
    type: 'stdio',
    ...engine.allowed,
  };
  const file = join(dir, `${HOST_NAME}.json`);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);

  return file;
};

/**
 * The checkout's dev profiles and every installed browser, with the folder
 * each reads native hosts from on macOS and Linux.
 */
const registrationTargets = () => [
  ...devProfileDirs().map(dir => ({
    name: 'Dev profile',
    engine: CHROMIUM,
    dataDir: dir,
    hostsDir: join(dir, 'NativeMessagingHosts'),
  })),
  ...installedBrowsers(),
];

/**
 * Registers the host on Windows: one manifest per engine, and the registry
 * key each browser reads pointing at its engine's manifest.
 */
const registerOnWindows = () => {
  const registrations = installedBrowsers().map(({ name, key, engine }) => ({
    browser: name,
    location: `HKCU\\Software\\${key}\\NativeMessagingHosts\\${HOST_NAME}`,
    engine,
  }));
  const keys = new Map(registrations.map(r => [r.location, r.engine]));
  const manifests = new Map();

  for (const [key, engine] of keys) {
    if (!manifests.has(engine)) {
      manifests.set(engine, writeManifest(engine.windowsManifestDir, engine));
    }

    const args = ['add', key, '/ve', '/d', manifests.get(engine), '/f'];

    execFileSync('reg', args, { stdio: 'ignore' });
  }

  return registrations.map(({ browser, location }) => ({ browser, location }));
};

/**
 * Registers the host copied into HOST_DIR with the checkout's dev profiles
 * and every installed browser, returning where, per browser.
 */
export const registerHost = () => {
  writeLauncher();

  if (IS_WINDOWS) {
    return registerOnWindows();
  }

  return registrationTargets().map(({ name, hostsDir, engine }) => {
    writeManifest(hostsDir, engine);

    return { browser: name, location: hostsDir };
  });
};

/**
 * Whether `install` has registered the host where browsers look for it.
 */
export const isHostRegistered = () => {
  const folders = IS_WINDOWS
    ? ENGINES.map(({ windowsManifestDir }) => windowsManifestDir)
    : registrationTargets().map(({ hostsDir }) => hostsDir);

  return (
    fs.existsSync(HOST_LAUNCHER_PATH) &&
    folders.some(dir => fs.existsSync(join(dir, `${HOST_NAME}.json`)))
  );
};

/**
 * The browsers Stylebot's CLI supports on this platform, by name.
 */
export const supportedBrowsers = () =>
  BROWSERS.filter(browser => browser[os.platform()]).map(
    browser => browser.name
  );

/**
 * The browsers, and dev profiles, with Stylebot in one of their profiles,
 * or undefined when there was no profile to look in.
 */
export const findStylebot = () => {
  const found = new Set();
  let count = 0;

  for (const { name, dataDir, engine } of registrationTargets()) {
    let profiles;

    try {
      profiles = engine.profiles(dataDir);
    } catch {
      continue;
    }

    count += profiles.length;

    if (profiles.some(engine.hasStylebot)) {
      found.add(name);
    }
  }

  return count ? [...found] : undefined;
};
