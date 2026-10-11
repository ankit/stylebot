import net from 'node:net';

import { cliStamp } from './protocol.mjs';

/**
 * Sends one command to the host listening on a socket and resolves to the
 * extension's response as it came. Rejects with the socket's error, whose
 * code says when no host listens there.
 */
export const exchange = (socketPath, command, args = {}, timeout = 0) =>
  new Promise((resolve, reject) => {
    const socket = net.connect(socketPath);
    let output = '';

    if (timeout) {
      socket.setTimeout(timeout, () => {
        socket.destroy();
        reject(new Error('The extension took too long to answer'));
      });
    }

    socket.on('connect', () =>
      socket.write(`${JSON.stringify({ command, args, ...cliStamp() })}\n`)
    );
    socket.on('data', chunk => (output += chunk));
    socket.on('error', reject);
    socket.on('end', () => {
      if (output) {
        resolve(JSON.parse(output));
      } else {
        reject(new Error('The extension closed the connection'));
      }
    });
  });
