import messages from 'virtual:stylebot-locale';
import { fn } from '@storybook/test';

import {
  add as addRecentColor,
  getAll as getAllRecentColors,
} from '@/apps/background/color-history';

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
  GalleryInstalled,
  GalleryPublished,
  GalleryScreenshotResponse,
  GalleryStyle,
  InstallGalleryPreviewResponse,
  ResetGalleryProfileResponse,
} from '@stylebot/types';

import { isMac, toBrowserShortcut } from '@stylebot/utils';

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
  // The page script's answer; "unreachable" leaves the message unanswered.
  pageSupport?: 'supported' | 'unsupported' | 'unreachable';
  googleDriveSync?: Pending<RunGoogleDriveSyncResponse>;
  versionHistory?: Pending<VersionHistory>;
  // Optional permissions already granted, and how the prompt answers a request.
  permissions?: { granted?: boolean; allowRequest?: boolean };
  gallery?: GalleryShimOptions;
};

export type GalleryShimOptions = {
  // What the profile published.
  published?: GalleryPublished;
  // Capturing the tab; pending keeps it capturing.
  capture?: Pending<GalleryScreenshotResponse>;
  // The popup's suggestions for the site, how many the site has in all, the
  // one the tab previews already, and what installing a preview answers.
  suggestions?: Array<GalleryStyle>;
  total?: number;
  previewing?: GalleryStyle;
  install?: InstallGalleryPreviewResponse;
  // The gallery style the profile was installed from.
  installed?: GalleryInstalled;
  // What ResetGalleryProfile answers; ok by default.
  reset?: ResetGalleryProfileResponse;
};

const GALLERY_SCREENSHOT =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 16 10"><rect width="16" height="10" fill="#dfe6f3"/><rect x="2" y="2" width="9" height="1.5" fill="#2a5fd6"/></svg>'
  );

// What the gallery shows for a published style, unlike a fresh capture.
export const GALLERY_PUBLISHED_SCREENSHOT =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 16 10"><rect width="16" height="10" fill="#1a1b26"/><rect x="2" y="2" width="9" height="1.5" fill="#7aa2f7"/></svg>'
  );

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
    'readability-settings': readabilitySettings,
    options,
    commands,
    // The popup reads a page's styles straight from storage.
    styles: Object.fromEntries(
      (overrides.styles ?? []).map(({ url, ...style }) => [url, style])
    ),
    ...overrides.storage,
  };
  const tab = {
    id: 1,
    active: true,
    url: overrides.tabUrl ?? 'https://example.com/article',
  };

  const gallery = { ...overrides.gallery };
  let previewing = gallery.previewing;

  const permissions = {
    granted: false,
    allowRequest: true,
    ...overrides.permissions,
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
    SetCommands: message => (message as unknown as { value: unknown }).value,
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
          hasMore: false,
          sites: [],
        },
      };
    },

    RestoreVersion: () => ({ ok: true, entryId: 'restored' }),

    UndoRestore: () => ({ ok: true }),

    OpenEditorSidePanel: () => true,

    GetPublishedGalleryStyle: () => ({
      published: gallery.published ?? null,
      installed: gallery.installed ?? null,
    }),
    ResetGalleryProfile: () => gallery.reset ?? { ok: true },
    CaptureGalleryScreenshot: () => {
      if (gallery.capture === 'pending') {
        return new Promise(() => undefined);
      }

      return gallery.capture ?? { ok: true, screenshot: GALLERY_SCREENSHOT };
    },
    OpenGalleryDraft: () => ({ ok: true }),
    GetGalleryStyle: message => {
      const { styleId } = message as unknown as { styleId: number };
      const style = gallery.suggestions?.find(each => each.id === styleId);

      return style
        ? { ok: true, style }
        : { ok: false, errorKey: 'gallery_error_not_found' };
    },
    GetGallerySuggestions: () => ({
      ok: true,
      styles: gallery.suggestions ?? [],
      total: gallery.total ?? gallery.suggestions?.length ?? 0,
      site: 'example.com',
    }),
    PreviewGalleryStyle: message => {
      const { id } = message as unknown as { id: number };
      previewing = gallery.suggestions?.find(each => each.id === id);

      return { ok: true };
    },
    GetGalleryPreview: () => ({
      preview: previewing
        ? { style: previewing, css: '', importUrls: [] }
        : null,
    }),
    InstallGalleryPreview: () =>
      gallery.install ?? { ok: true, profileName: previewing?.name ?? '' },
    EndGalleryPreview: () => {
      previewing = undefined;
    },

    CreateProfile: () => ({ profileId: 'created' }),
  };

  const tabResponses: Record<string, () => unknown> = {
    GetIsStylebotOpen: () => overrides.isOpen ?? false,
    GetIsPageReaderable: () => overrides.pageReaderable ?? true,
    GetCanStylePage: () => {
      const support = overrides.pageSupport ?? 'supported';
      return support === 'unreachable' ? undefined : support === 'supported';
    },
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
      // The popup's gallery preview port; the stand-in page has no listener.
      connect: () => ({
        postMessage: () => undefined,
        disconnect: () => undefined,
      }),
      query: (_info: unknown, callback?: Callback) => respond(callback, [tab]),
    },

    windows: {
      getCurrent: (_info: unknown, callback?: Callback) =>
        respond(callback, { tabs: [tab] }),
    },

    sidePanel: {
      setOptions: () => Promise.resolve(),
      open: () => Promise.resolve(),
      close: () => Promise.resolve(),
    },

    permissions: {
      contains: fn((_permissions: unknown, callback?: Callback) =>
        respond(callback, permissions.granted)
      ),
      request: fn((_permissions: unknown, callback?: Callback) => {
        permissions.granted = permissions.allowRequest;
        return respond(callback, permissions.allowRequest);
      }),
      remove: fn((_permissions: unknown, callback?: Callback) => {
        permissions.granted = false;
        return respond(callback, true);
      }),
    },

    // The browser owns the global shortcuts; this one reports the seeded ones.
    commands: {
      getAll: () =>
        Promise.resolve(
          Object.entries(commands).map(([name, combo]) => ({
            name,
            shortcut: toBrowserShortcut(combo, isMac()) ?? '',
          }))
        ),
    },
  };

  (window as unknown as { chrome: typeof shim }).chrome = shim;
};
