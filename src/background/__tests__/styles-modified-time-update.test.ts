import StylesModifiedTimeUpdate from '../styles-modified-time-update';

const EPOCH = '1970-01-01T00:00:00.000Z';

describe('StylesModifiedTimeUpdate', () => {
  let store: Record<string, unknown>;

  beforeEach(() => {
    store = {};

    global.chrome = {
      storage: {
        local: {
          get: jest.fn((key: string, callback: (items: unknown) => void) => {
            callback({ [key]: store[key] });
          }),
          set: jest.fn(
            (items: Record<string, unknown>, callback?: () => void) => {
              Object.assign(store, items);
              callback?.();
            }
          ),
        },
      },
    } as unknown as typeof chrome;
  });

  it('backfills a missing modifiedTime with the epoch, not the current time', async () => {
    store['styles'] = {
      'example.com': { css: 'color: red', enabled: true, readability: false },
    };

    await StylesModifiedTimeUpdate();

    const styles = store['styles'] as Record<string, { modifiedTime: string }>;
    expect(styles['example.com'].modifiedTime).toBe(EPOCH);
  });

  it('never overwrites an existing modifiedTime', async () => {
    store['styles'] = {
      'example.com': {
        css: 'color: red',
        enabled: true,
        readability: false,
        modifiedTime: '2024-06-01T00:00:00.000Z',
      },
      'other.com': { css: 'color: blue', enabled: true, readability: false },
    };

    await StylesModifiedTimeUpdate();

    const styles = store['styles'] as Record<string, { modifiedTime: string }>;
    expect(styles['example.com'].modifiedTime).toBe('2024-06-01T00:00:00.000Z');
    expect(styles['other.com'].modifiedTime).toBe(EPOCH);
  });

  it('does not touch styles-metadata, so a backfill never reads as a local edit', async () => {
    store['styles'] = {
      'example.com': { css: 'color: red', enabled: true, readability: false },
    };

    await StylesModifiedTimeUpdate();

    expect(store['styles-metadata']).toBeUndefined();
  });

  it('writes nothing when every style already has a modifiedTime', async () => {
    store['styles'] = {
      'example.com': {
        css: 'color: red',
        enabled: true,
        readability: false,
        modifiedTime: '2024-06-01T00:00:00.000Z',
      },
    };

    await StylesModifiedTimeUpdate();

    expect(chrome.storage.local.set).not.toBeCalled();
  });

  it('resolves when there are no styles at all', async () => {
    await expect(StylesModifiedTimeUpdate()).resolves.toBeUndefined();
    expect(chrome.storage.local.set).not.toBeCalled();
  });
});
