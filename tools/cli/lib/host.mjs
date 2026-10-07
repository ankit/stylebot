/**
 * The native messaging host the browser starts for Stylebot. Relays each
 * request from the `stylebot` CLI, which arrives on a Unix socket, to the
 * extension over stdio, and its response back.
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

import { SOCKET_PATH } from './paths.mjs';

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
    const { command, args } = JSON.parse(input.slice(0, newline));

    pending.set(id, client);
    send({ id, command, args });
  });

  client.on('close', () => {
    for (const [id, waiting] of pending) {
      if (waiting === client) {
        pending.delete(id);
      }
    }
  });
});

const cleanup = () => {
  server.close();
  fs.rmSync(SOCKET_PATH, { force: true });
  process.exit(0);
};

// The browser closes stdin when the extension reloads or quits.
process.stdin.on('end', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

fs.mkdirSync(path.dirname(SOCKET_PATH), { recursive: true, mode: 0o700 });
// The newest browser to start the host takes over the socket.
fs.rmSync(SOCKET_PATH, { force: true });
server.listen(SOCKET_PATH, () => fs.chmodSync(SOCKET_PATH, 0o600));
