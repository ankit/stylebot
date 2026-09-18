import { set, enable } from '../styles';

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
          get: jest.fn((key: string, callback: (items: unknown) => void) => {
            // Simulate the read taking a tick, so a second write can start
            // before the first one's read-modify-write finishes — mirroring
            // rapid keystrokes in the code editor firing overlapping
            // SetStyle messages. Deep-clone, since real chrome.storage.local
            // returns a structured-clone copy, not a live reference.
            const snapshot = JSON.parse(JSON.stringify(store[key]));
            setTimeout(() => callback({ [key]: snapshot }), 10);
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

  it('does not lose a concurrent edit to a different url', async () => {
    const otherWrite = set('other.com', 'body { color: blue; }', false);
    const enableWrite = enable('example.com');

    await Promise.all([otherWrite, enableWrite]);

    const styles = store.styles as Record<string, { enabled: boolean }>;
    expect(styles['other.com']).toBeTruthy();
    expect(styles['example.com'].enabled).toBe(true);
  });
});
