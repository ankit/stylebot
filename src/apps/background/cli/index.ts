import { hasCliPermissions, setCliConnected } from '@stylebot/settings';
import type { StylebotOptions } from '@stylebot/types';

import { get as getOption } from '../options';
import { reloadForGrant, resumeAfterGrantReload } from '../grant-reload';
import { browserCommands } from './browser';
import { pseudoStateCommands } from './pseudo-states';
import { inspectCommands } from './inspect';
import { getUnreadNotice, modeCommands, noteCliActivity } from './mode';
import { optionCommands } from './options';
import { pageCommands } from './pages';
import { pointerCommands } from './pointer';
import { profileCommands } from './profiles';
import { CLI_PROTOCOL } from './protocol';
import { streamCommands } from './streams';
import { styleCommands } from './styles';
import type { CliCommands, CliRequest, CliResponse } from './types';

const HOST_NAME = 'dev.stylebot.cli';

// A missing host disconnects at once, so a port that outlives this has one.
const CONNECTED_AFTER_MS = 500;
const RELOADED_FOR_CLI_KEY = 'cli-reloaded-for-grant';

const commands: CliCommands = {
  ...browserCommands,
  ...pageCommands,
  ...pointerCommands,
  ...pseudoStateCommands,
  ...inspectCommands,
  ...styleCommands,
  ...profileCommands,
  ...optionCommands,
  ...modeCommands,
};

// Requests still running, by id, to stop when the CLI goes away.
const running = new Map<number, AbortController>();

let port: chrome.runtime.Port | undefined;

/**
 * Stops every request still running, once their host has gone.
 */
const stopRunning = (): void => {
  for (const controller of running.values()) {
    controller.abort();
  }

  running.clear();
};

/**
 * Connects to the Stylebot CLI's native host, which relays commands from
 * the `stylebot` command line. A missing host just leaves the CLI offline.
 */
const connect = (): void => {
  const connected = chrome.runtime.connectNative(HOST_NAME);
  port = connected;

  const settled = setTimeout(() => {
    if (port === connected) {
      setCliConnected(true);
    }
  }, CONNECTED_AFTER_MS);

  connected.onDisconnect.addListener(() => {
    // Reading lastError keeps a missing host from logging as unchecked.
    void chrome.runtime.lastError;
    clearTimeout(settled);

    if (port === connected) {
      stopRunning();
      port = undefined;
      setCliConnected(false);
    }
  });

  connected.onMessage.addListener(async (request: CliRequest) => {
    if (request.cancel) {
      running.get(request.id)?.abort();
      running.delete(request.id);
      return;
    }

    const stamp = {
      id: request.id,
      protocol: CLI_PROTOCOL,
      version: chrome.runtime.getManifest().version,
    };

    const controller = new AbortController();
    const post = (message: unknown): void => {
      try {
        connected.postMessage(message);
      } catch {
        // The host went away mid-request.
      }
    };
    let response: CliResponse;

    running.set(request.id, controller);

    try {
      const run = commands[request.command];
      const stream = streamCommands[request.command];

      // The CLI explains a mismatch, from the protocol on the response.
      if (request.protocol !== undefined && request.protocol !== CLI_PROTOCOL) {
        throw new Error(
          `The stylebot CLI speaks protocol ${request.protocol}, not ${CLI_PROTOCOL}`
        );
      }

      if (!run && !stream) {
        throw new Error(`Unknown command: ${request.command}`);
      }

      const args = request.args ?? {};

      noteCliActivity(request.command, args).catch(() => undefined);

      const { signal } = controller;
      const emit = (event: unknown): void => post({ id: request.id, event });
      let result: unknown;

      if (stream) {
        result = await stream(args, emit, signal);
      } else {
        result = await run(args, signal);
      }

      const notice = getUnreadNotice();

      response = { ...stamp, result, ...(notice && { notice }) };
    } catch (e) {
      response = {
        ...stamp,
        error: e instanceof Error ? e.message : String(e),
      };
    } finally {
      if (running.get(request.id) === controller) {
        running.delete(request.id);
      }
    }

    post(response);
  });
};

const disconnect = (): void => {
  port?.disconnect();
  port = undefined;
  stopRunning();
  setCliConnected(false);
};

let pendingUpdate = Promise.resolve();
let startedAfterGrantReload = Promise.resolve(false);

/**
 * Connects while the CLI setting is on and its permissions are granted, and
 * disconnects otherwise. Updates run one at a time so two can't both connect.
 */
export const updateCliBridge = (): Promise<void> => {
  pendingUpdate = pendingUpdate
    .then(async () => {
      const allowed =
        (await getOption('cliAccess')) === true && (await hasCliPermissions());

      if (allowed && !port) {
        if (typeof chrome.runtime.connectNative === 'function') {
          connect();
          startedAfterGrantReload = Promise.resolve(false);
        } else {
          const reloaded = await startedAfterGrantReload;

          if (!reloaded) {
            await reloadForGrant(RELOADED_FOR_CLI_KEY, {
              optionsRoute: '/basics',
            });
          } else {
            console.error('Stylebot CLI: connectNative is unavailable.');
          }
        }
      } else if (!allowed && port) {
        disconnect();
      }
    })
    .catch(e => console.error('Stylebot CLI:', e));

  return pendingUpdate;
};

/**
 * Keeps the CLI's connection in step with its setting and permissions. Call
 * it synchronously at service worker start, for Chrome to wake it for them.
 */
export const initCliBridge = (): void => {
  chrome.permissions.onAdded.addListener(updateCliBridge);
  chrome.permissions.onRemoved.addListener(updateCliBridge);

  chrome.storage.onChanged.addListener((changes, area) => {
    const options = changes['options'];
    const was = (options?.oldValue as StylebotOptions | undefined)?.cliAccess;
    const is = (options?.newValue as StylebotOptions | undefined)?.cliAccess;

    if (area === 'local' && was !== is) {
      updateCliBridge();
    }
  });

  setCliConnected(false);
  startedAfterGrantReload = resumeAfterGrantReload(RELOADED_FOR_CLI_KEY);
  updateCliBridge();
};

export { initCliMode } from './mode';
