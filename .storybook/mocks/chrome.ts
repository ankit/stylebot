import messages from 'virtual:stylebot-locale';

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
} from '@stylebot/types';

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

  return entry.message.replace(/\$([^$]+)\$/g, (_, name) => {
    const index = Number(entry.placeholders?.[name]?.content.slice(1)) - 1;
    return substitutions[index] ?? '';
  });
};

const respond = (callback: Callback | undefined, value: unknown) => {
  if (callback) {
    setTimeout(() => callback(value), 0);
  }
};

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
    ...overrides.storage,
  };
  const tab = {
    id: 1,
    active: true,
    url: overrides.tabUrl ?? 'https://example.com/article',
  };

  const runtimeResponses: Record<string, (message: any) => unknown> = {
    GetStylesForPage: () => ({
      styles: overrides.styles ?? [],
      defaultStyle: overrides.defaultStyle,
    }),
    GetCommands: () => commands,
    GetOption: message => options[message.optionName as keyof StylebotOptions],
    GetAllOptions: () => options,
    GetReadabilitySettings: () => readabilitySettings,
    GetRecentColors: () => overrides.recentColors ?? [],
    AddRecentColor: () => overrides.recentColors ?? [],
  };

  const tabResponses: Record<string, () => unknown> = {
    GetIsStylebotOpen: () => overrides.isOpen ?? false,
    GetIsPageReaderable: () => overrides.pageReaderable ?? true,
  };

  const shim = {
    runtime: {
      sendMessage: (message: { name: string }, callback?: Callback) => {
        respond(callback, runtimeResponses[message.name]?.(message));
      },
      getURL: (p: string) => `/stub/${p}`,
      getManifest: () => ({ version: MANIFEST_VERSION }),
      onMessage: {
        addListener: () => undefined,
        removeListener: () => undefined,
      },
    },

    i18n: { getMessage },

    storage: {
      local: {
        get: (keys: string | Array<string>, callback: Callback) => {
          const list = Array.isArray(keys) ? keys : [keys];
          const items: Record<string, unknown> = {};

          list.forEach(key => {
            items[key] = storage[key];
          });

          respond(callback, items);
        },
        set: (items: Record<string, unknown>, callback?: Callback) => {
          Object.assign(storage, items);
          respond(callback, undefined);
        },
      },
    },

    tabs: {
      sendMessage: (
        _id: number,
        message: { name: string },
        callback?: Callback
      ) => {
        respond(callback, tabResponses[message.name]?.());
      },
      create: () => undefined,
    },

    windows: {
      getCurrent: (_info: unknown, callback: Callback) => {
        respond(callback, { tabs: [tab] });
      },
    },
  };

  (window as any).chrome = shim;
};
