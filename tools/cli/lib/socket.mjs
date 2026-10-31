import net from 'node:net';

import { cliStamp } from './protocol.mjs';

/**
 * Sends one command to the host listening on a socket and resolves to the
 * extension's response as it came, after handing a streaming command's
 * events, one a line, to onEvent. Rejects with the socket's error, whose
 * code says when no host listens there.
 */
export const sendToHost = (
  socketPath,
  command,
  args = {},
  timeout = 0,
  onEvent = undefined
) =>
  new Promise((resolve, reject) => {
    const socket = net.connect(socketPath);
    let output = '';

    /**
     * Hands on each complete event line, leaving the response, which comes
     * last, in output.
     */
    const flushEvents = () => {
      let newline = output.indexOf('\n');

      while (newline !== -1) {
        const message = JSON.parse(output.slice(0, newline));

        if (!('event' in message)) {
          return;
        }

        output = output.slice(newline + 1);
        onEvent?.(message.event);
        newline = output.indexOf('\n');
      }
    };

    if (timeout) {
      socket.setTimeout(timeout, () => {
        socket.destroy();
        reject(new Error('The extension took too long to answer'));
      });
    }

    socket.on('connect', () =>
      socket.write(`${JSON.stringify({ command, args, ...cliStamp() })}\n`)
    );
    socket.on('data', chunk => {
      output += chunk;
      flushEvents();
    });
    socket.on('error', reject);
    socket.on('end', () => {
      if (output) {
        resolve(JSON.parse(output));
      } else {
        reject(new Error('The extension closed the connection'));
      }
    });
  });
