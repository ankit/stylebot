import { inspectCommands } from './inspect';
import { pageCommands } from './pages';
import { profileCommands } from './profiles';
import { styleCommands } from './styles';
import type { CliCommands, CliRequest, CliResponse } from './types';

const HOST_NAME = 'dev.stylebot.cli';

const commands: CliCommands = {
  ...pageCommands,
  ...inspectCommands,
  ...styleCommands,
  ...profileCommands,
};

/**
 * Connects to the Stylebot CLI's native host, which relays commands from
 * the `stylebot` command line. A missing host just leaves the CLI offline.
 */
export const initCliBridge = (): void => {
  const port = chrome.runtime.connectNative(HOST_NAME);

  port.onDisconnect.addListener(() => {
    // Reading lastError keeps a missing host from logging as unchecked.
    void chrome.runtime.lastError;
  });

  port.onMessage.addListener(async (request: CliRequest) => {
    let response: CliResponse;

    try {
      const run = commands[request.command];

      if (!run) {
        throw new Error(`Unknown command: ${request.command}`);
      }

      response = { id: request.id, result: await run(request.args ?? {}) };
    } catch (e) {
      response = {
        id: request.id,
        error: e instanceof Error ? e.message : String(e),
      };
    }

    try {
      port.postMessage(response);
    } catch {
      // The host went away mid-request.
    }
  });
};
