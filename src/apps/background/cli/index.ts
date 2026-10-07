import { hasCliPermissions } from '@stylebot/settings';
import type { StylebotOptions } from '@stylebot/types';

import { OpenOptionsPage } from '../messages';
import { get as getOption } from '../options';
import { inspectCommands } from './inspect';
import { pageCommands } from './pages';
import { profileCommands } from './profiles';
import { styleCommands } from './styles';
import type { CliCommands, CliRequest, CliResponse } from './types';

const HOST_NAME = 'dev.stylebot.cli';
const RELOADED_FOR_GRANT_KEY = 'cli-reloaded-for-grant';

const commands: CliCommands = {
  ...pageCommands,
  ...inspectCommands,
  ...styleCommands,
  ...profileCommands,
};

let port: chrome.runtime.Port | undefined;

/**
 * Connects to the Stylebot CLI's native host, which relays commands from
 * the `stylebot` command line. A missing host just leaves the CLI offline.
 */
const connect = (): void => {
  const connected = chrome.runtime.connectNative(HOST_NAME);
  port = connected;

  connected.onDisconnect.addListener(() => {
    // Reading lastError keeps a missing host from logging as unchecked.
    void chrome.runtime.lastError;

    if (port === connected) {
      port = undefined;
    }
  });

  connected.onMessage.addListener(async (request: CliRequest) => {
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
      connected.postMessage(response);
    } catch {
      // The host went away mid-request.
    }
  });
};

const disconnect = (): void => {
  port?.disconnect();
  port = undefined;
};

let pendingUpdate = Promise.resolve();
let reloadedForGrant = Promise.resolve(false);

/**
 * Chrome adds connectNative only to contexts started with nativeMessaging, so
 * a grant to a running worker needs a reload. Options reopens after it.
 */
const reloadForGrant = async (): Promise<void> => {
  await chrome.storage.local.set({ [RELOADED_FOR_GRANT_KEY]: true });
  chrome.runtime.reload();
};

/**
 * Reopens Options after a reload for a grant, and reports whether this start
 * followed one, so a browser that still lacks connectNative isn't reloaded again.
 */
const resumeAfterGrantReload = async (): Promise<boolean> => {
  const items = await chrome.storage.local.get(RELOADED_FOR_GRANT_KEY);

  if (!items[RELOADED_FOR_GRANT_KEY]) {
    return false;
  }

  await chrome.storage.local.remove(RELOADED_FOR_GRANT_KEY);
  OpenOptionsPage({ route: '/basics' });
  return true;
};

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
          reloadedForGrant = Promise.resolve(false);
        } else if (!(await reloadedForGrant)) {
          await reloadForGrant();
        } else {
          console.error('Stylebot CLI: connectNative is unavailable.');
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

  reloadedForGrant = resumeAfterGrantReload();
  updateCliBridge();
};
