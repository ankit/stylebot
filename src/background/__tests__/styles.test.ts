import 'jest-fetch-mock';

jest.mock('../sync-scheduler', () => ({
  scheduleSyncAfterEdit: jest.fn().mockResolvedValue(undefined),
}));

import {
  set,
  setAll,
  enable,
  disable,
  move,
  setReadability,
  getGoogleWebFontExists,
  ensureCompiledStyles,
} from '../styles';
import { scheduleSyncAfterEdit } from '../sync-scheduler';
import * as compiledStylesModule from '../compiled-styles';

describe('set', () => {
  let store: Record<string, unknown>;

  beforeEach(() => {
    jest.resetModules();

    store = {
      styles: {
        'example.com': {
          css: 'body { color: red; }',
          readability: false,
          enabled: false,
          modifiedTime: 1,
        },
      },
    };

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(
            (keys: string | Array<string>) =>
              new Promise(resolve => {
                // Simulate the read taking a tick, so a second write can start
                // before the first one's read-modify-write finishes — mirroring
                // rapid keystrokes in the code editor firing overlapping
                // SetStyle messages. Deep-clone, since real chrome.storage.local
                // returns a structured-clone copy, not a live reference.
                const items: Record<string, unknown> = {};
                for (const key of Array.isArray(keys) ? keys : [keys]) {
                  if (store[key] !== undefined) {
                    items[key] = JSON.parse(JSON.stringify(store[key]));
                  }
                }
                setTimeout(() => resolve(items), 10);
              })
          ),
          set: jest.fn(
            (items: Record<string, unknown>) =>
              new Promise<void>(resolve => {
                setTimeout(() => {
                  Object.assign(store, items);
                  resolve();
                }, 0);
              })
          ),
        },
      },
    } as unknown as typeof chrome;
  });

  it('does not lose a concurrent edit to a different url', async () => {
    const otherWrite = set('other.com', 'body { color: blue; }', false);
    const enableWrite = enable('example.com');

    await Promise.all([otherWrite, enableWrite]);

    const styles = store.styles as Record<string, { enabled: boolean }>;
    expect(styles['other.com']).toBeTruthy();
    expect(styles['example.com'].enabled).toBe(true);
  });

  it('keeps Override site styles off when a save leaves the setting out', async () => {
    (store.styles as Record<string, { forceImportant?: boolean }>)[
      'example.com'
    ].forceImportant = false;

    await set('example.com', 'body { color: blue; }', false);

    const styles = store.styles as Record<string, { forceImportant?: boolean }>;
    expect(styles['example.com'].forceImportant).toBe(false);
  });

  it('stores the setting a save passes, dropping the field when true', async () => {
    await set('example.com', 'body { color: blue; }', false, false);
    let styles = store.styles as Record<string, object>;
    expect(styles['example.com']).toHaveProperty('forceImportant', false);

    await set('example.com', 'body { color: blue; }', false, true);
    styles = store.styles as Record<string, object>;
    expect(styles['example.com']).not.toHaveProperty('forceImportant');
  });
});

describe('style edits', () => {
  type StoredStyle = {
    css: string;
    enabled: boolean;
    readability: boolean;
    modifiedTime: string;
  };

  let store: { styles: Record<string, StoredStyle> };
  const stored = (url: string) => store.styles[url];
  // Style writes only: each one also records a history entry, which is its
  // own write to its own key.
  const writes = () =>
    (chrome.storage.local.set as jest.Mock).mock.calls.filter(
      ([items]) => 'styles' in items
    ).length;

  beforeEach(() => {
    jest.resetModules();

    store = {
      styles: {
        'example.com': {
          css: 'body { color: red; }',
          readability: false,
          enabled: true,
          modifiedTime: '2024-01-01T00:00:00.000Z',
        },
      },
    };

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(async (keys: string | Array<string>) => {
            const items: Record<string, unknown> = {};

            (Array.isArray(keys) ? keys : [keys]).forEach(key => {
              const held = store[key as 'styles'];

              items[key] =
                held === undefined
                  ? undefined
                  : JSON.parse(JSON.stringify(held));
            });

            return items;
          }),
          set: jest.fn(async (items: Record<string, unknown>) => {
            Object.assign(store, items);
          }),
        },
      },
    } as unknown as typeof chrome;
  });

  // Sync merges by per-style modifiedTime, so a toggle that leaves it alone
  // loses to any older edit of the same style on another device.
  it('stamps modifiedTime when a style is disabled, enabled or moved', async () => {
    await disable('example.com');
    expect(stored('example.com').enabled).toBe(false);
    expect(stored('example.com').modifiedTime).not.toBe(
      '2024-01-01T00:00:00.000Z'
    );

    store.styles['example.com'].modifiedTime = '2024-01-01T00:00:00.000Z';
    await enable('example.com');
    expect(stored('example.com').modifiedTime).not.toBe(
      '2024-01-01T00:00:00.000Z'
    );

    store.styles['example.com'].modifiedTime = '2024-01-01T00:00:00.000Z';
    await move('example.com', 'moved.com');
    expect(stored('example.com')).toBeUndefined();
    expect(stored('moved.com').modifiedTime).not.toBe(
      '2024-01-01T00:00:00.000Z'
    );
  });

  it('skips the write when enabling or disabling changes nothing', async () => {
    await enable('example.com');
    await disable('missing.com');

    expect(writes()).toBe(0);
  });

  it('skips the write when readability is already at the requested value', async () => {
    await setReadability('example.com', false);
    await setReadability('missing.com', false);

    expect(writes()).toBe(0);
    expect(stored('missing.com')).toBeUndefined();
  });

  it('creates a blank style when readability is turned on for a new url', async () => {
    await setReadability('new.com', true);

    expect(stored('new.com')).toMatchObject({ css: '', readability: true });
    expect(writes()).toBe(1);
  });

  it('lines up a sync after an edit, but not after a write sync itself made', async () => {
    (scheduleSyncAfterEdit as jest.Mock).mockClear();

    await disable('example.com');
    await enable('missing.com');
    expect(scheduleSyncAfterEdit).toBeCalledTimes(1);

    await setAll({}, { fromSync: true });
    expect(scheduleSyncAfterEdit).toBeCalledTimes(1);

    await setAll({});
    expect(scheduleSyncAfterEdit).toBeCalledTimes(2);
  });
});

const fontUrl = 'https://fonts.googleapis.com/css2?family=Muli&display=swap';

describe('getGoogleWebFontExists', () => {
  it('is true when the google web font API serves the family', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 200 }));

    await expect(getGoogleWebFontExists(fontUrl)).resolves.toBe(true);
  });

  it('is false when the google web font API returns 400', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 400 }));

    await expect(getGoogleWebFontExists(fontUrl)).resolves.toBe(false);
  });

  it('is false when the request fails', async () => {
    fetchMock.mockResponse(() => Promise.reject(new Error('offline')));

    await expect(getGoogleWebFontExists(fontUrl)).resolves.toBe(false);
  });
});

describe('compiled styles', () => {
  let store: Record<string, unknown>;

  const style = { css: 'a { color: red; }', enabled: true, readability: false };

  beforeEach(() => {
    store = {};

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(async (keys: string | Array<string>) => {
            const items: Record<string, unknown> = {};
            for (const key of Array.isArray(keys) ? keys : [keys]) {
              if (store[key] !== undefined) {
                items[key] = JSON.parse(JSON.stringify(store[key]));
              }
            }
            return items;
          }),
          set: jest.fn(async (items: Record<string, unknown>) => {
            Object.assign(store, items);
          }),
        },
      },
    } as unknown as typeof chrome;
  });

  it('stores the compiled copy with every write, stamped with its revision', async () => {
    await setAll({ 'a.com': { ...style, modifiedTime: 't' } });

    const revision = (store['styles-metadata'] as { modifiedTime: string })
      .modifiedTime;

    expect(store['styles-compiled']).toEqual({
      version: 1,
      revision,
      styles: {
        'a.com': {
          css: 'a { color: red !important; }',
          importUrls: [],
          enabled: true,
          readability: false,
        },
      },
    });
  });

  it('reuses the stored compiled copy on a write only when it matches the styles being replaced', async () => {
    const compileStyles = jest.spyOn(compiledStylesModule, 'compileStyles');

    await setAll({ 'a.com': { ...style, modifiedTime: 't' } });
    await setAll({ 'a.com': { ...style, enabled: false, modifiedTime: 't' } });

    expect(compileStyles.mock.calls[1][2]).toEqual({
      styles: { 'a.com': { ...style, modifiedTime: 't' } },
      compiled: expect.objectContaining({ 'a.com': expect.anything() }),
    });

    store['styles-metadata'] = { modifiedTime: 'written-elsewhere' };
    await setAll({ 'a.com': { ...style, modifiedTime: 't' } });

    expect(compileStyles.mock.calls[2][2]).toBeUndefined();
    compileStyles.mockRestore();
  });

  it('builds the compiled copy when none is stored yet', async () => {
    store.styles = { 'a.com': { ...style, modifiedTime: 't' } };
    store['styles-metadata'] = { modifiedTime: 'rev-1' };

    const compiled = await ensureCompiledStyles();

    expect(compiled.revision).toBe('rev-1');
    expect(compiled.styles['a.com'].css).toBe('a { color: red !important; }');
    expect(store['styles-compiled']).toEqual(compiled);
  });

  it('keeps a stored copy that matches the current styles', async () => {
    const stored = { version: 1, revision: 'rev-1', styles: {} };
    store.styles = { 'a.com': { ...style, modifiedTime: 't' } };
    store['styles-metadata'] = { modifiedTime: 'rev-1' };
    store['styles-compiled'] = stored;

    expect(await ensureCompiledStyles()).toEqual(stored);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it.each([
    ['built from other styles', { version: 1, revision: 'rev-0', styles: {} }],
    ['from an older compiler', { version: 0, revision: 'rev-1', styles: {} }],
  ])('rebuilds a stored copy %s', async (_label, stored) => {
    store.styles = { 'a.com': { ...style, modifiedTime: 't' } };
    store['styles-metadata'] = { modifiedTime: 'rev-1' };
    store['styles-compiled'] = stored;

    const compiled = await ensureCompiledStyles();

    expect(compiled).toMatchObject({ version: 1, revision: 'rev-1' });
    expect(Object.keys(compiled.styles)).toEqual(['a.com']);
  });
});
