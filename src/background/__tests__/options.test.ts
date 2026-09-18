import { set } from '../options';

describe('set', () => {
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
          get: jest.fn((key: string, callback: (items: unknown) => void) => {
            // Simulate the read taking a tick, so a second set() call can
            // start before the first one's read-modify-write finishes.
            setTimeout(() => callback({ [key]: store[key] }), 10);
          }),
          set: jest.fn(
            (items: Record<string, unknown>, callback?: () => void) => {
              setTimeout(() => {
                Object.assign(store, items);
                callback?.();
              }, 0);
            }
          ),
        },
      },
    } as unknown as typeof chrome;
  });

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

    expect(store.options).toEqual({
      mode: 'code',
      layout: newLayout,
    });
  });
});
