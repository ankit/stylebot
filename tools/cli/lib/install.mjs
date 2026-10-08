import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { HOST_DIR } from './paths.mjs';
import { describeRegistrations, registerHost } from './register.mjs';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

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

  const registrations = registerHost();

  console.log(describeRegistrations(registrations));

  if (registrations.length) {
    console.log(
      'Turn on "Let apps on this computer control Stylebot" in Stylebot\'s options to connect. If it\'s already on, reload the extension or restart the browser.'
    );
  }
};
