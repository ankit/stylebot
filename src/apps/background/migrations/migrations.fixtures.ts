/**
 * An in-memory chrome.storage.local that hands out copies, as the real one
 * does, so a migration cannot change stored data without writing it.
 */
export const fakeStorage = (
  items: Record<string, unknown>
): Record<string, unknown> => {
  const store: Record<string, unknown> = JSON.parse(JSON.stringify(items));
  const copy = <T>(value: T): T =>
    value === undefined ? value : JSON.parse(JSON.stringify(value));

  global.chrome = {
    commands: { update: jest.fn() },
    storage: {
      local: {
        get: jest.fn(async (keys: string | Array<string>) =>
          Object.fromEntries(
            [keys]
              .flat()
              .filter(key => key in store)
              .map(key => [key, copy(store[key])])
          )
        ),
        set: jest.fn(async (values: Record<string, unknown>) => {
          Object.assign(store, copy(values));
        }),
        remove: jest.fn(async (keys: string | Array<string>) => {
          for (const key of [keys].flat()) {
            delete store[key];
          }
        }),
      },
    },
  } as unknown as typeof chrome;

  return store;
};

/**
 * Storage as Stylebot 3.2.4 leaves it on a profile that started on 3.2.x: the
 * metadata as a bare string, shortcuts in storage, the old sync metadata.
 */
export const storageFrom324 = {
  styles: {
    'example.com': {
      css: 'body { color: red; }',
      enabled: true,
      readability: false,
      modifiedTime: '2026-09-01T10:00:00.000+02:00',
    },
    'news.example.org': {
      css: '',
      enabled: false,
      readability: true,
      modifiedTime: '2026-09-02T10:00:00.000+02:00',
    },
  },
  'styles-metadata': '2026-09-02T10:00:00.000+02:00',
  commands: { stylebot: 'alt+m', style: 'alt+shift+t', readability: '' },
  options: { contextMenu: true },
  default_shortcut_update_complete: true,
  'google-drive-sync': {
    id: 'drive-file',
    modifiedTime: '2026-09-02T09:00:00.000Z',
  },
};

/**
 * Storage holding a style with no edit time, as older versions saved them,
 * and no sync set up.
 */
export const storageWithoutEditTimes = {
  styles: {
    'example.com': {
      css: 'a { color: blue; }',
      enabled: true,
      readability: false,
    },
  },
  'styles-metadata': { modifiedTime: '2022-07-01T10:00:00.000Z' },
  default_shortcut_update_complete: true,
};
