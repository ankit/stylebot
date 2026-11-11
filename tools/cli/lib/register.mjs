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
const FIREFOX_ID = '{52bda3fd-dc48-4b3d-a7b9-58af57879f1e}';

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
    name: 'Firefox',
    firefox: true,
    darwin: 'Firefox',
    linux: '.mozilla/firefox',
    win32: 'Mozilla\\Firefox',
    key: 'Mozilla',
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

/*
 * Firefox's user data, which holds profiles.ini, and the folders it reads
 * native hosts from: under ~/Library/Application Support on macOS, home on
 * Linux, where newer Firefox may use ~/.config/mozilla, and %APPDATA% on
 * Windows, where they're registered under an HKCU key instead.
 */
const installedFirefox = browser => {
  const platform = os.platform();
  const home = os.homedir();

  if (platform === 'darwin') {
    const support = join(home, 'Library', 'Application Support');

    return [
      {
        dataDir: join(support, browser.darwin),
        hostsDir: join(support, 'Mozilla', 'NativeMessagingHosts'),
      },
    ];
  }

  if (platform === 'linux') {
    return [home, join(home, '.config')].map((root, i) => ({
      dataDir: join(root, i === 0 ? '.mozilla' : 'mozilla', 'firefox'),
      hostsDir: join(
        root,
        i === 0 ? '.mozilla' : 'mozilla',
        'native-messaging-hosts'
      ),
    }));
  }

  const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');

  return [{ dataDir: join(appData, browser.win32) }];
};

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
 * hosts go in (or, on Windows, their user data folder). A browser writes
 * Local State on its first run; its folder alone can be just our manifest.
 */
const installedBrowsers = () => {
  const platform = os.platform();
  const home = os.homedir();
  const root = {
    darwin: join(home, 'Library', 'Application Support'),
    linux: join(home, '.config'),
    win32: process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'),
  }[platform];

  return BROWSERS.filter(browser => root && browser[platform]).flatMap(
    browser => {
      if (browser.firefox) {
        return installedFirefox(browser)
          .filter(({ dataDir }) => fs.existsSync(join(dataDir, 'profiles.ini')))
          .map(dirs => ({ ...browser, ...dirs }));
      }

      if (!fs.existsSync(join(root, browser[platform], 'Local State'))) {
        return [];
      }

      const dir = join(
        root,
        (platform === 'darwin' && browser.darwinHosts) || browser[platform]
      );

      return [
        {
          ...browser,
          dataDir: join(root, browser[platform]),
          hostsDir: join(dir, 'NativeMessagingHosts'),
        },
      ];
    }
  );
};

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

// Who may start the host: Chromium names extensions by origin, Firefox by add-on id.
const CHROMIUM_ALLOWED = {
  allowed_origins: EXTENSION_IDS.map(id => `chrome-extension://${id}/`),
};
const FIREFOX_ALLOWED = { allowed_extensions: [FIREFOX_ID] };

/**
 * Writes the host manifest into a folder, returning its path.
 */
const writeManifest = (dir, firefox = false) => {
  const allowed = firefox ? FIREFOX_ALLOWED : CHROMIUM_ALLOWED;
  const manifest = {
    name: HOST_NAME,
    description: 'Stylebot CLI',
    path: HOST_LAUNCHER_PATH,
    type: 'stdio',
    ...allowed,
  };
  const file = join(dir, `${HOST_NAME}.json`);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);

  return file;
};

// Where Windows keeps Firefox's manifest, apart from Chromium's.
const FIREFOX_MANIFEST_DIR = join(STATE_DIR, 'firefox');

/**
 * The folders registerHost writes host manifests to on macOS and Linux,
 * per browser.
 */
const manifestFolders = () =>
  [
    ...devProfileDirs().map(dir => ({
      name: 'Dev profile',
      hostsDir: join(dir, 'NativeMessagingHosts'),
    })),
    ...installedBrowsers(),
  ].map(({ name, hostsDir, firefox = false }) => ({
    browser: name,
    location: hostsDir,
    firefox,
  }));

/**
 * Registers the host copied into HOST_DIR with the checkout's dev profiles
 * and every installed browser, returning where, per browser.
 */
export const registerHost = () => {
  writeLauncher();

  if (IS_WINDOWS) {
    const browsers = installedBrowsers();
    const manifests = {
      chromium: browsers.some(({ firefox }) => !firefox)
        ? writeManifest(STATE_DIR)
        : undefined,
      firefox: browsers.some(({ firefox }) => firefox)
        ? writeManifest(FIREFOX_MANIFEST_DIR, true)
        : undefined,
    };

    const registrations = browsers.map(browser => ({
      browser: browser.name,
      location: `HKCU\\Software\\${browser.key}\\NativeMessagingHosts\\${HOST_NAME}`,
      manifest: browser.firefox ? manifests.firefox : manifests.chromium,
    }));
    const keys = new Map(registrations.map(r => [r.location, r.manifest]));

    for (const [key, manifest] of keys) {
      execFileSync('reg', ['add', key, '/ve', '/d', manifest, '/f'], {
        stdio: 'ignore',
      });
    }

    return registrations.map(({ browser, location }) => ({
      browser,
      location,
    }));
  }

  const registrations = manifestFolders();

  for (const { location, firefox } of registrations) {
    writeManifest(location, firefox);
  }

  return registrations.map(({ browser, location }) => ({ browser, location }));
};

/**
 * Whether `install` has registered the host where browsers look for it.
 */
export const isHostRegistered = () => {
  const folders = IS_WINDOWS
    ? [STATE_DIR, FIREFOX_MANIFEST_DIR]
    : manifestFolders().map(({ location }) => location);

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
 * Whether a browser profile has Stylebot. A store install unpacks into its
 * Extensions folder, and every install, unpacked ones too, keeps settings
 * in its preferences.
 */
const profileHasStylebot = profile =>
  EXTENSION_IDS.some(id => fs.existsSync(join(profile, 'Extensions', id))) ||
  ['Preferences', 'Secure Preferences'].some(file => {
    try {
      const { extensions } = JSON.parse(
        fs.readFileSync(join(profile, file), 'utf8')
      );

      return EXTENSION_IDS.some(id => id in (extensions?.settings ?? {}));
    } catch {
      return false;
    }
  });

/**
 * Whether a Firefox profile has Stylebot: a store install keeps its package
 * in the extensions folder, and every install is listed in extensions.json.
 */
const firefoxProfileHasStylebot = profile => {
  if (fs.existsSync(join(profile, 'extensions', `${FIREFOX_ID}.xpi`))) {
    return true;
  }

  try {
    return fs
      .readFileSync(join(profile, 'extensions.json'), 'utf8')
      .includes(`"${FIREFOX_ID}"`);
  } catch {
    return false;
  }
};

/**
 * Firefox's profile folders, which sit in a Profiles folder except on Linux.
 */
const firefoxProfiles = dataDir => {
  const dir =
    IS_WINDOWS || os.platform() === 'darwin'
      ? join(dataDir, 'Profiles')
      : dataDir;

  return fs
    .readdirSync(dir)
    .map(entry => join(dir, entry))
    .filter(profile => fs.existsSync(join(profile, 'prefs.js')));
};

/**
 * The browsers, and dev profiles, with Stylebot in one of their profiles,
 * or undefined when there was no profile to look in.
 */
export const findStylebot = () => {
  const browsers = [
    ...devProfileDirs().map(dir => ({ name: 'Dev profile', dataDir: dir })),
    ...installedBrowsers(),
  ];
  const found = new Set();
  let profiles = 0;

  for (const { name, dataDir, firefox } of browsers) {
    if (firefox) {
      let firefoxes;

      try {
        firefoxes = firefoxProfiles(dataDir);
      } catch {
        continue;
      }

      profiles += firefoxes.length;

      if (firefoxes.some(firefoxProfileHasStylebot)) {
        found.add(name);
      }

      continue;
    }

    let entries;

    try {
      entries = fs.readdirSync(dataDir);
    } catch {
      continue;
    }

    for (const profile of entries.map(entry => join(dataDir, entry))) {
      if (fs.existsSync(join(profile, 'Preferences'))) {
        profiles++;

        if (profileHasStylebot(profile)) {
          found.add(name);
        }
      }
    }
  }

  return profiles ? [...found] : undefined;
};
