import os from 'node:os';
import path from 'node:path';

export const IS_WINDOWS = os.platform() === 'win32';

// Picked by platform rather than by the running OS, so tests can stand in for Windows.
const { join, basename } = IS_WINDOWS ? path.win32 : path.posix;

export const HOST_NAME = 'dev.stylebot.cli';
export const STATE_DIR = join(os.homedir(), '.stylebot');
export const PIPE_DIR = '\\\\.\\pipe\\';
// Pipes share one namespace across the machine's users.
const USER = IS_WINDOWS ? os.userInfo().username : '';

/**
 * Where a host listens: a Unix socket, or on Windows, which has none, a
 * named pipe. A socket path given on Windows names a pipe after its file.
 */
const socketPath = custom => {
  if (!IS_WINDOWS) {
    return custom || join(STATE_DIR, 'cli.sock');
  }

  if (/^\\\\[.?]\\pipe\\/.test(custom ?? '')) {
    return custom;
  }

  return `${PIPE_DIR}stylebot-${custom ? basename(custom) : `cli-${USER}`}`;
};

// Set, the host and the CLI use only this socket, so a test browser stays apart from yours.
export const SOCKET_OVERRIDE = process.env.STYLEBOT_SOCKET
  ? socketPath(process.env.STYLEBOT_SOCKET)
  : undefined;
// The one socket every browser's host shared before each got its own.
export const SHARED_SOCKET_PATH = socketPath();
export const SOCKETS_DIR = join(STATE_DIR, 'browsers');
// Matches a host's own pipe, as hostSocketPath names it on Windows.
export const HOST_PIPE = new RegExp(
  `^stylebot-browser-\\d+-${USER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
);

/**
 * Where the host with this process id listens, so each browser (or browser
 * profile) running Stylebot has its own socket.
 */
export const hostSocketPath = pid => {
  if (SOCKET_OVERRIDE) {
    return SOCKET_OVERRIDE;
  }

  return IS_WINDOWS
    ? `${PIPE_DIR}stylebot-browser-${pid}-${USER}`
    : join(SOCKETS_DIR, `${pid}.sock`);
};

export const HOST_DIR = join(STATE_DIR, 'host');
export const HOST_LAUNCHER_PATH = join(
  STATE_DIR,
  IS_WINDOWS ? 'native-host.cmd' : 'native-host'
);
// Named after the socket, so a test browser's host doesn't mark yours as started.
export const HOST_STARTED_PATH = join(
  STATE_DIR,
  `${basename(SOCKET_OVERRIDE ?? SHARED_SOCKET_PATH)}.started`
);
// The CLI version that copied the host, to copy it again after an update.
export const HOST_VERSION_PATH = join(HOST_DIR, 'version');
