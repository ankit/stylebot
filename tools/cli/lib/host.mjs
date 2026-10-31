/**
 * The native messaging host the browser starts for Stylebot. Relays each
 * request from the `stylebot` CLI, which arrives on a Unix socket (a named
 * pipe on Windows), to the extension over stdio, and its response back. A
 * streaming command gets events first, each written as its own line.
 * Each browser profile running Stylebot starts its own host, on its own socket.
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

import {
  HOST_STARTED_PATH,
  IS_WINDOWS,
  STATE_DIR,
  hostSocketPath,
} from './paths.mjs';

const SOCKET_PATH = hostSocketPath(process.pid);

const pending = new Map();
let nextId = 1;

/**
 * Sends one message to the extension, framed as native messaging expects:
 * a 32-bit length in native byte order, then the JSON.
 */
const send = message => {
  const body = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(body.length);
  process.stdout.write(Buffer.concat([header, body]));
};

let buffered = Buffer.alloc(0);

process.stdin.on('data', chunk => {
  buffered = Buffer.concat([buffered, chunk]);

  while (buffered.length >= 4) {
    const length = buffered.readUInt32LE(0);

    if (buffered.length < 4 + length) {
      break;
    }

    const message = JSON.parse(buffered.subarray(4, 4 + length).toString());
    buffered = buffered.subarray(4 + length);

    const client = pending.get(message.id);

    if ('event' in message) {
      client?.write(`${JSON.stringify(message)}\n`);
      continue;
    }

    pending.delete(message.id);
    client?.end(`${JSON.stringify(message)}\n`);
  }
});

const server = net.createServer(client => {
  let input = '';

  client.on('data', chunk => {
    input += chunk;
    const newline = input.indexOf('\n');

    if (newline === -1) {
      return;
    }

    const id = nextId++;

    pending.set(id, client);
    send({ ...JSON.parse(input.slice(0, newline)), id });
  });

  client.on('close', () => {
    for (const [id, waiting] of pending) {
      if (waiting === client) {
        pending.delete(id);
        // Ends a stream, or a wait, the CLI gave up on.
        send({ id, cancel: true });
      }
    }
  });
});

const cleanup = () => {
  server.close();

  if (!IS_WINDOWS) {
    fs.rmSync(SOCKET_PATH, { force: true });
  }

  process.exit(0);
};

// The browser closes stdin when the extension reloads or quits.
process.stdin.on('end', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Tells the CLI the browser has started the host, so the setting is on.
try {
  fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(HOST_STARTED_PATH, `${new Date().toISOString()}\n`);
} catch {
  // Only the CLI's error messages need it.
}

if (IS_WINDOWS) {
  // A pipe can't be taken over, so with STYLEBOT_SOCKET the first browser keeps it.
  server.on('error', error => {
    console.error(`stylebot: can't listen on ${SOCKET_PATH}: ${error.message}`);
    process.exit(1);
  });
  server.listen(SOCKET_PATH);
} else {
  fs.mkdirSync(path.dirname(SOCKET_PATH), { recursive: true, mode: 0o700 });
  // A stale socket from a crashed host, or with STYLEBOT_SOCKET, another browser's.
  fs.rmSync(SOCKET_PATH, { force: true });
  server.listen(SOCKET_PATH, () => fs.chmodSync(SOCKET_PATH, 0o600));
}
