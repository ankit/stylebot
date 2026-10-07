import os from 'node:os';
import path from 'node:path';

export const HOST_NAME = 'dev.stylebot.cli';
export const STATE_DIR = path.join(os.homedir(), '.stylebot');
// Overridable so a second browser, such as a test one, doesn't take over the first's socket.
export const SOCKET_PATH =
  process.env.STYLEBOT_SOCKET || path.join(STATE_DIR, 'cli.sock');
export const HOST_DIR = path.join(STATE_DIR, 'host');
export const HOST_LAUNCHER_PATH = path.join(STATE_DIR, 'native-host');
