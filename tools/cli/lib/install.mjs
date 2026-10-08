import fs from 'node:fs';
import path from 'node:path';

import { CLI_VERSION, LIB_DIR } from './package.mjs';
import { HOST_DIR, HOST_VERSION_PATH } from './paths.mjs';
import {
  describeRegistrations,
  launcherNode,
  registerHost,
  writeLauncher,
} from './register.mjs';

/**
 * Copies the native host into ~/.stylebot, noting this CLI's version.
 */
const copyHost = () => {
  fs.mkdirSync(HOST_DIR, { recursive: true, mode: 0o700 });

  // A copy, so the host keeps running whatever happens to this checkout.
  for (const file of ['host.mjs', 'paths.mjs']) {
    fs.copyFileSync(path.join(LIB_DIR, file), path.join(HOST_DIR, file));
  }

  fs.writeFileSync(HOST_VERSION_PATH, `${CLI_VERSION}\n`);
};

/**
 * Copies the native host into ~/.stylebot and registers it with the
 * checkout's dev profiles and the installed browsers.
 */
export const install = () => {
  copyHost();

  const registrations = registerHost();

  console.log(describeRegistrations(registrations));

  if (registrations.length) {
    console.log(
      'Turn on "Let apps on this computer control Stylebot" in Stylebot\'s options to connect. If it\'s already on, reload the extension or restart the browser.'
    );
  }
};

/**
 * Brings an installed host up to date with this CLI: copies it again when
 * another version installed it, and repins the launcher when its node is
 * gone, such as after a node upgrade. Reports whether the launcher was
 * repinned, since the browser can't have started the host before it.
 */
export const refreshHost = () => {
  const node = launcherNode();

  if (!node) {
    return { repinned: false };
  }

  const installed = fs.existsSync(HOST_VERSION_PATH)
    ? fs.readFileSync(HOST_VERSION_PATH, 'utf8').trim()
    : undefined;

  if (installed !== CLI_VERSION) {
    copyHost();
  }

  if (fs.existsSync(node)) {
    return { repinned: false };
  }

  writeLauncher();
  return { repinned: true };
};
