import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { IS_WINDOWS, STATE_DIR } from '../paths.mjs';

const { join } = IS_WINDOWS ? path.win32 : path.posix;

// What each store assigns Stylebot; Chrome's comes from the public key dev builds carry too.
const EXTENSION_IDS = [
  'oiaejidbmkiecgbjeifoejpgmdaleoha',
  'mjolbpfednnbebfapicajpifliopnnai',
];
/**
 * Whether a Chromium profile has Stylebot. A store install unpacks into its
 * Extensions folder, and every install, unpacked ones too, keeps settings
 * in its preferences.
 */
const chromiumProfileHasStylebot = profile =>
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

/*
 * How Chrome, Edge and the other Chromium browsers keep their user data,
 * read native hosts and keep extensions.
 */
export const CHROMIUM = {
  /**
   * A browser's user data under ~/Library/Application Support, ~/.config or
   * %LOCALAPPDATA%, once it has run: it writes Local State on its first run,
   * and its folder alone can be just our manifest.
   */
  installs(browser) {
    const platform = os.platform();
    const home = os.homedir();
    const root = {
      darwin: join(home, 'Library', 'Application Support'),
      linux: join(home, '.config'),
      win32: process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'),
    }[platform];

    if (!root || !fs.existsSync(join(root, browser[platform], 'Local State'))) {
      return [];
    }

    const hostsRoot =
      (platform === 'darwin' && browser.darwinHosts) || browser[platform];

    return [
      {
        dataDir: join(root, browser[platform]),
        hostsDir: join(root, hostsRoot, 'NativeMessagingHosts'),
      },
    ];
  },

  allowed: {
    allowed_origins: EXTENSION_IDS.map(id => `chrome-extension://${id}/`),
  },

  windowsManifestDir: STATE_DIR,

  profiles: dataDir =>
    fs
      .readdirSync(dataDir)
      .map(entry => join(dataDir, entry))
      .filter(profile => fs.existsSync(join(profile, 'Preferences'))),

  hasStylebot: chromiumProfileHasStylebot,
};
