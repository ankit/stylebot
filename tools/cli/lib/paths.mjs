import os from 'node:os';
import path from 'node:path';

export const IS_WINDOWS = os.platform() === 'win32';

// Picked by platform rather than by the running OS, so tests can stand in for Windows.
const { join, basename } = IS_WINDOWS ? path.win32 : path.posix;

/**
 * Where the host listens: a Unix socket, or on Windows, which has none, a
 * named pipe. A socket path given on Windows names a pipe after its file.
 */
const socketPath = custom => {
  if (!IS_WINDOWS) {
    return custom || join(STATE_DIR, 'cli.sock');
  }

  if (/^\\\\[.?]\\pipe\\/.test(custom ?? '')) {
    return custom;
  }

  // Pipes share one namespace across the machine's users.
  return `\\\\.\\pipe\\stylebot-${
    custom ? basename(custom) : `cli-${os.userInfo().username}`
  }`;
};

export const HOST_NAME = 'dev.stylebot.cli';
export const STATE_DIR = join(os.homedir(), '.stylebot');
// Overridable so a second browser, such as a test one, doesn't take over the first's socket.
export const SOCKET_PATH = socketPath(process.env.STYLEBOT_SOCKET);
export const HOST_DIR = join(STATE_DIR, 'host');
export const HOST_LAUNCHER_PATH = join(
  STATE_DIR,
  IS_WINDOWS ? 'native-host.cmd' : 'native-host'
);
