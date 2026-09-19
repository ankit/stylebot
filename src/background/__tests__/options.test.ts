import { defaultOptions } from '@stylebot/settings';

import { getAll, set, pruneRetired } from '../options';

let store: Record<string, unknown>;

beforeEach(() => {
  jest.resetModules();

  store = {
    options: {
      mode: 'basic',
      layout: { width: 300, adjustPageLayout: true, dockLocation: 'right' },
    },
  };

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(
          (key: string) =>
            new Promise(resolve => {
              // Simulate the read taking a tick, so a second set() call can
              // start before the first one's read-modify-write finishes.
              setTimeout(() => resolve({ [key]: store[key] }), 10);
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

describe('set', () => {
  it('does not lose a field written by a concurrent set() call', async () => {
    // Both dispatched before either has read storage, mirroring rapid
    // SetOption messages (e.g. dragging the resize handle right after
    // switching the editor tab).
    const newLayout = {
      width: 450,
      adjustPageLayout: true,
      dockLocation: 'right' as const,
    };

    const modeWrite = set('mode', 'code');
    const layoutWrite = set('layout', newLayout);

    await Promise.all([modeWrite, layoutWrite]);

    expect(store.options).toMatchObject({
      mode: 'code',
      layout: newLayout,
    });
  });
});

describe('getAll', () => {
  it('fills in defaults for keys missing from stored options', async () => {
    // Profiles from before a key existed have no entry for it at all.
    expect(await getAll()).toEqual({
      ...defaultOptions,
      mode: 'basic',
      layout: { width: 300, adjustPageLayout: true, dockLocation: 'right' },
    });
  });
});

describe('pruneRetired', () => {
  it('drops keys that are no longer StylebotOptions and keeps the rest', async () => {
    store.options = {
      mode: 'code',
      basicModeSections: { text: true, colors: true },
    };

    await pruneRetired();

    expect(store.options).toEqual({ mode: 'code' });
  });

  it('leaves storage untouched when nothing is stored or nothing is retired', async () => {
    store = {};
    await pruneRetired();
    expect(chrome.storage.local.set).not.toHaveBeenCalled();

    store.options = { mode: 'code' };
    await pruneRetired();
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
});
