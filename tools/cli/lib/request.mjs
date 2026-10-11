import { chooseSocket } from './browsers.mjs';
import { diagnoseConnection } from './diagnose.mjs';
import { exchange } from './exchange.mjs';
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
 * Sends one command to the extension through the native host of the browser
 * it's meant for, and resolves to its result.
 */
export const request = async (command, args = {}) => {
  const { repinned } = prepareHost();
  let response;

  try {
    response = await exchange(await chooseSocket(), command, args);
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

  return response.result;
};

/**
 * Prints a command's result through its formatter, or as JSON with --json.
 */
export const createPrinter = program => (result, format) =>
  console.log(
    program.opts().json ? JSON.stringify(result, null, 2) : format(result)
  );
