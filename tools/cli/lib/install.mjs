import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { HOST_DIR, HOST_LAUNCHER_PATH, HOST_NAME } from './paths.mjs';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

// What Chrome derives from the store's public key, which dev builds carry too.
const EXTENSION_ID = 'oiaejidbmkiecgbjeifoejpgmdaleoha';

/**
 * The Stylebot checkout the current directory is in, whose dev profiles
 * `yarn dev:chrome` launches with, or undefined outside one.
 */
const findCheckout = () => {
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    if (
      fs.existsSync(path.join(dir, 'src/assets/manifest/manifest-dev.json'))
    ) {
      return dir;
    }

    if (dir === path.dirname(dir)) {
      return undefined;
    }
  }
};

/**
 * Where a browser looks for user-level native hosts: the checkout's dev
 * profiles, and each installed browser's own.
 */
const hostManifestDirs = () => {
  const checkout = findCheckout();
  const devProfiles = checkout
    ? fs
        .readdirSync(checkout)
        .filter(name => /^\.(chrome|edge)-dev-profile/.test(name))
    : [];

  if (checkout && !devProfiles.includes('.chrome-dev-profile')) {
    devProfiles.push('.chrome-dev-profile');
  }

  const home = os.homedir();
  const browserDirs =
    process.platform === 'darwin'
      ? [
          'Library/Application Support/Google/Chrome',
          'Library/Application Support/Microsoft Edge',
        ]
      : ['.config/google-chrome', '.config/microsoft-edge'];

  return [
    ...devProfiles.map(name => path.join(checkout, name)),
    ...browserDirs
      .map(dir => path.join(home, dir))
      .filter(dir => fs.existsSync(dir)),
  ].map(dir => path.join(dir, 'NativeMessagingHosts'));
};

/**
 * Copies the native host into ~/.stylebot and registers it with the
 * checkout's dev profiles and the installed browsers.
 */
export const install = () => {
  fs.mkdirSync(HOST_DIR, { recursive: true, mode: 0o700 });

  // A copy, so the host keeps running whatever happens to this checkout.
  for (const file of ['host.mjs', 'paths.mjs']) {
    fs.copyFileSync(path.join(LIB_DIR, file), path.join(HOST_DIR, file));
  }

  // Browsers start the host without the shell's PATH, so pin this node.
  fs.writeFileSync(
    HOST_LAUNCHER_PATH,
    `#!/bin/sh\nexec "${process.execPath}" "${path.join(
      HOST_DIR,
      'host.mjs'
    )}"\n`,
    { mode: 0o755 }
  );

  const manifest = {
    name: HOST_NAME,
    description: 'Stylebot CLI',
    path: HOST_LAUNCHER_PATH,
    type: 'stdio',
    allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
  };

  for (const dir of hostManifestDirs()) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `${HOST_NAME}.json`),
      `${JSON.stringify(manifest, null, 2)}\n`
    );
    console.log(`Registered in ${dir}`);
  }

  console.log(
    'Reload the extension (or restart yarn dev:chrome), then turn on "Let apps on this computer control Stylebot" in its options to connect.'
  );
};
