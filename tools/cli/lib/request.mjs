import { chooseSocket } from './browsers.mjs';
import { diagnoseConnection } from './diagnose.mjs';
import { sendToHost } from './socket.mjs';
import { prepareHost } from './install.mjs';
import { incompatibility } from './protocol.mjs';
import { isStyled, linkify } from './style.mjs';

export const fail = message => {
  console.error(
    `stylebot: ${isStyled(process.stderr) ? linkify(message) : message}`
  );
  process.exit(1);
};

/**
 * Prints a notice the extension added to a response after the command's own
 * output, once the CLI exits without an error.
 */
const printNoticeOnExit = notice =>
  process.on('exit', code => {
    if (code === 0) {
      (process.argv.includes('--json') ? console.error : console.log)(notice);
    }
  });

/**
 * Sends one command to the extension through the native host of the browser
 * it's meant for, and resolves to its result. A streaming command's events
 * go to onEvent as they come.
 */
export const request = async (command, args = {}, onEvent = undefined) => {
  const { repinned } = prepareHost();
  let response;

  try {
    const socket = await chooseSocket();
    response = await sendToHost(socket, command, args, 0, onEvent);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ECONNREFUSED') {
      throw new Error(diagnoseConnection({ code: error.code, repinned }));
    }

    throw error;
  }

  const problem = incompatibility(response);

  if (problem) {
    throw new Error(problem);
  }

  if ('error' in response) {
    throw new Error(response.error);
  }

  if (response.notice) {
    printNoticeOnExit(response.notice);
  }

  return response.result;
};

/**
 * Prints a command's result through its formatter, or as JSON with --json.
 */
export const createPrinter = program => (result, format) =>
  console.log(
    program.opts().json ? JSON.stringify(result, null, 2) : format(result)
  );
