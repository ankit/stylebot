import fs from 'node:fs';

import { HOST_STARTED_PATH } from './paths.mjs';
import { findStylebot, isHostRegistered } from './register.mjs';

/**
 * Why the CLI couldn't reach the host, and the one thing that fixes it.
 * A refused connection means a host listened on the socket before.
 */
export const diagnoseConnection = ({ code, repinned }) => {
  if (!isHostRegistered()) {
    return 'No supported browser found. Install Chrome or Edge, then try again.';
  }

  if (repinned) {
    return 'The CLI was set up again for your new node. Restart the browser.';
  }

  if (code !== 'ECONNREFUSED' && !fs.existsSync(HOST_STARTED_PATH)) {
    // Only on evidence: no profile to look in leaves the setting as the likely cause.
    if (findStylebot()?.length === 0) {
      return 'No browser has Stylebot yet. Add it from stylebot.dev, then turn on "Let apps on this computer control Stylebot" in its settings — stylebot.dev/cli';
    }

    return 'Not connected yet. Turn on "Let apps on this computer control Stylebot" in Stylebot\'s settings — stylebot.dev/cli';
  }

  return 'No browser is running Stylebot. Open Chrome (or Edge) with Stylebot.';
};
