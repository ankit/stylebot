import net from 'node:net';

import { diagnoseConnection } from './diagnose.mjs';
import { prepareHost } from './install.mjs';
import { SOCKET_PATH } from './paths.mjs';
import { cliStamp, incompatibility } from './protocol.mjs';
import { isStyled, linkify } from './style.mjs';

export const fail = message => {
  console.error(
    `stylebot: ${isStyled(process.stderr) ? linkify(message) : message}`
  );
  process.exit(1);
};

/**
 * Sends one command to the extension through the native host and resolves
 * to its result.
 */
export const request = (command, args = {}) =>
  new Promise((resolve, reject) => {
    const { repinned } = prepareHost();
    const socket = net.connect(SOCKET_PATH);
    let output = '';

    socket.on('connect', () =>
      socket.write(`${JSON.stringify({ command, args, ...cliStamp() })}\n`)
    );
    socket.on('data', chunk => (output += chunk));
    socket.on('error', error => {
      if (error.code === 'ENOENT' || error.code === 'ECONNREFUSED') {
        reject(new Error(diagnoseConnection({ code: error.code, repinned })));
      } else {
        reject(error);
      }
    });
    socket.on('end', () => {
      if (!output) {
        reject(new Error('The extension closed the connection'));
        return;
      }

      const response = JSON.parse(output);
      const problem = incompatibility(response);

      if (problem) {
        reject(new Error(problem));
      } else if ('error' in response) {
        reject(new Error(response.error));
      } else {
        resolve(response.result);
      }
    });
  });

/**
 * Prints a command's result through its formatter, or as JSON with --json.
 */
export const createPrinter = program => (result, format) =>
  console.log(
    program.opts().json ? JSON.stringify(result, null, 2) : format(result)
  );
