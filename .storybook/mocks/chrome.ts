import messages from 'virtual:stylebot-locale';

import {
  add as addRecentColor,
  getAll as getAllRecentColors,
} from '@/background/color-history';

import {
  defaultOptions,
  defaultCommands,
  defaultReadabilitySettings,
} from '@stylebot/settings';
import type {
  Style,
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  RunGoogleDriveSyncResponse,
  VersionHistory,
} from '@stylebot/types';

/**
 * A response a story can leave unresolved, to show the surface still waiting.
 */
type Pending<T> = T | 'pending';

export type ChromeShimOptions = {
  styles?: Array<Style>;
  defaultStyle?: Style;
  options?: Partial<StylebotOptions>;
  commands?: Partial<StylebotCommands>;
  readabilitySettings?: Partial<ReadabilitySettings>;
  recentColors?: Array<string>;
  storage?: Record<string, unknown>;
  isOpen?: boolean;
  pageReaderable?: boolean;
  tabUrl?: string;
  googleDriveSync?: Pending<RunGoogleDriveSyncResponse>;
  versionHistory?: Pending<VersionHistory>;
};

type Callback = (response?: unknown) => void;

/* Pinned so stories don't churn on every release. */
const MANIFEST_VERSION = '3.2.0';
const RELEASE_VERSION = MANIFEST_VERSION.split('.').slice(0, 2).join('.');

const getMessage = (key: string, substitutions: Array<string> = []) => {
  const entry = messages[key];

  if (!entry) {
    return '';
  }

  return entry.message.replace(/\$([^$]+)\$/g, (_: string, name: string) => {
    const index = Number(entry.placeholders?.[name]?.content.slice(1)) - 1;
    return substitutions[index] ?? '';
  });
};

/* Like Chrome, answers asynchronously through a callback when one is
   passed and always resolves a promise, so both call styles work. */
const respond = (callback: Callback | undefined, value: unknown) =>
  new Promise<unknown>(resolve => {
    setTimeout(async () => {
      const resolved = await value;
      callback?.(resolved);
      resolve(resolved);
    }, 0);
  });

/**
 * Installs a fresh in-memory window.chrome for the current story so
 * production code paths (i18n, messaging, storage) run unmodified.
 */
export const installChrome = (overrides: ChromeShimOptions = {}): void => {
  const options = { ...defaultOptions, ...overrides.options };
  const commands = { ...defaultCommands, ...overrides.commands };
  const readabilitySettings = {
    ...defaultReadabilitySettings,
    ...overrides.readabilitySettings,
  };
  const storage: Record<string, unknown> = {
    [`notification~release/${RELEASE_VERSION}`]: true,
    recentColors: overrides.recentColors ?? [],
    ...overrides.storage,
  };
  const tab = {
    id: 1,
    active: true,
    url: overrides.tabUrl ?? 'https://example.com/article',
  };

  const runtimeResponses: Record<
    string,
    (message: {
      name: string;
      optionName?: keyof StylebotOptions;
      color?: string;
    }) => unknown
  > = {
    GetStylesForPage: () => ({
      styles: overrides.styles ?? [],
      defaultStyle: overrides.defaultStyle,
    }),
    GetCommands: () => commands,
    GetOption: message =>
      message.optionName ? options[message.optionName] : undefined,
    GetAllOptions: () => options,
    GetReadabilitySettings: () => readabilitySettings,
    // The background's own history, over the shim's storage.
    GetRecentColors: () => getAllRecentColors(),
    AddRecentColor: ({ color = '' }) => addRecentColor(color),
    // Mirrors the background's own side effects on a real sync, so the
    // popup (which reads sync state back off storage) sees the result too.
    RunGoogleDriveSync: () => {
      if (overrides.googleDriveSync === 'pending') {
        return new Promise(() => undefined);
      }

      const response = overrides.googleDriveSync ?? {
        ok: false,
        errorKey: 'sync_error_unknown',
      };

      if (response.ok) {
        storage['google-drive-sync-needs-auth'] = false;
        storage['google-drive-sync-state'] = {
          ...(storage['google-drive-sync-state'] as
            | Record<string, unknown>
            | undefined),
          remoteRevision: response.metadata.modifiedTime,
          localRevision: response.metadata.modifiedTime,
          lastSyncedAt: new Date().toISOString(),
          metadata: response.metadata,
        };
      }

      return response;
    },

    ScanVersionHistory: () => {
      if (overrides.versionHistory === 'pending') {
        return new Promise(() => undefined);
      }

      return {
        scan: overrides.versionHistory ?? {
          versions: [],
          previews: {},
          changes: {},
          total: 0,
        },
      };
    },

    RestoreVersion: () => ({ ok: true }),
  };

  const tabResponses: Record<string, () => unknown> = {
    GetIsStylebotOpen: () => overrides.isOpen ?? false,
    GetIsPageReaderable: () => overrides.pageReaderable ?? true,
  };

  const shim = {
    runtime: {
      sendMessage: (message: { name: string }, callback?: Callback) =>
        respond(callback, runtimeResponses[message.name]?.(message)),
      getURL: (p: string) => `/${p}`,
      getManifest: () => ({ version: MANIFEST_VERSION }),
      onMessage: {
        addListener: () => undefined,
        removeListener: () => undefined,
      },
    },

    i18n: { getMessage },

    storage: {
      local: {
        get: (keys: string | Array<string>, callback?: Callback) => {
          const list = Array.isArray(keys) ? keys : [keys];
          const items: Record<string, unknown> = {};

          list.forEach(key => {
            items[key] = storage[key];
          });

          return respond(callback, items);
        },
        set: (items: Record<string, unknown>, callback?: Callback) => {
          Object.assign(storage, items);
          return respond(callback, undefined);
        },
      },
      onChanged: {
        addListener: () => undefined,
        removeListener: () => undefined,
      },
    },

    tabs: {
      sendMessage: (
        _id: number,
        message: { name: string },
        callback?: Callback
      ) => respond(callback, tabResponses[message.name]?.()),
      create: () => respond(undefined, undefined),
    },

    windows: {
      getCurrent: (_info: unknown, callback?: Callback) =>
        respond(callback, { tabs: [tab] }),
    },
  };

  (window as unknown as { chrome: typeof shim }).chrome = shim;
};
