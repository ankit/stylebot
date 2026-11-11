import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { IS_WINDOWS, STATE_DIR } from '../paths.mjs';

const { join } = IS_WINDOWS ? path.win32 : path.posix;

const FIREFOX_ID = '{52bda3fd-dc48-4b3d-a7b9-58af57879f1e}';

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

/*
 * How Firefox keeps its user data, reads native hosts and keeps add-ons.
 */
export const FIREFOX = {
  /**
   * Firefox's user data, holding profiles.ini, under ~/Library/Application
   * Support, home or %APPDATA%. On Linux, newer Firefox may use
   * ~/.config/mozilla instead of ~/.mozilla.
   */
  installs(browser) {
    const platform = os.platform();
    const home = os.homedir();
    let installs;

    if (platform === 'darwin') {
      const support = join(home, 'Library', 'Application Support');

      installs = [
        {
          dataDir: join(support, browser.darwin),
          hostsDir: join(support, 'Mozilla', 'NativeMessagingHosts'),
        },
      ];
    } else if (platform === 'linux') {
      installs = [join(home, '.mozilla'), join(home, '.config', 'mozilla')].map(
        dir => ({
          dataDir: join(dir, 'firefox'),
          hostsDir: join(dir, 'native-messaging-hosts'),
        })
      );
    } else {
      const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');

      installs = [{ dataDir: join(appData, browser.win32) }];
    }

    return installs.filter(({ dataDir }) =>
      fs.existsSync(join(dataDir, 'profiles.ini'))
    );
  },

  allowed: { allowed_extensions: [FIREFOX_ID] },

  windowsManifestDir: join(STATE_DIR, 'firefox'),

  // Profiles sit in a Profiles folder, except on Linux.
  profiles: dataDir => {
    const dir = os.platform() === 'linux' ? dataDir : join(dataDir, 'Profiles');

    return fs
      .readdirSync(dir)
      .map(entry => join(dir, entry))
      .filter(profile => fs.existsSync(join(profile, 'prefs.js')));
  },

  hasStylebot: firefoxProfileHasStylebot,
};
