import 'jest-fetch-mock';

import {
  set,
  enable,
  disable,
  move,
  setReadability,
  getGoogleWebFontExists,
} from '../styles';

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
            (key: string) =>
              new Promise(resolve => {
                // Simulate the read taking a tick, so a second write can start
                // before the first one's read-modify-write finishes — mirroring
                // rapid keystrokes in the code editor firing overlapping
                // SetStyle messages. Deep-clone, since real chrome.storage.local
                // returns a structured-clone copy, not a live reference.
                const snapshot = JSON.parse(JSON.stringify(store[key]));
                setTimeout(() => resolve({ [key]: snapshot }), 10);
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
  const writes = () =>
    (chrome.storage.local.set as jest.Mock).mock.calls.length;

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
          get: jest.fn(async (key: string) => ({
            [key]: JSON.parse(JSON.stringify(store[key as 'styles'])),
          })),
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
