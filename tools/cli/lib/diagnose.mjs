import fs from 'node:fs';

import { HOST_STARTED_PATH } from './paths.mjs';
import { isHostRegistered } from './register.mjs';

/**
 * Why the CLI couldn't reach the host, and the one thing that fixes it.
 * A refused connection means a host listened on the socket before.
 */
export const diagnoseConnection = ({ code, repinned }) => {
  if (!isHostRegistered()) {
    return 'Stylebot is not set up for this computer. Run `stylebot install`.';
  }

  if (repinned) {
    return 'The CLI was set up again for your new node. Restart the browser.';
  }

  if (code !== 'ECONNREFUSED' && !fs.existsSync(HOST_STARTED_PATH)) {
    return 'Stylebot is not connected. Turn on "Let apps on this computer control Stylebot" in Stylebot\'s settings — stylebot.dev/cli';
  }

  return 'Stylebot is not running. Open Chrome (or Edge) with Stylebot.';
};
