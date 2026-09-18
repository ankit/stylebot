import StylesMetadataUpdate from '../styles-metadata-update';

describe('StylesMetadataUpdate', () => {
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

  it('repairs a bare timestamp string, keeping the original time', async () => {
    store['styles-metadata'] = '2024-01-01T00:00:00.000Z';

    await StylesMetadataUpdate();

    expect(store['styles-metadata']).toEqual({
      modifiedTime: '2024-01-01T00:00:00.000Z',
    });
  });

  it('seeds the metadata when it is missing', async () => {
    await StylesMetadataUpdate();

    const metadata = store['styles-metadata'] as { modifiedTime: string };
    expect(typeof metadata.modifiedTime).toBe('string');
    expect(Number.isNaN(new Date(metadata.modifiedTime).getTime())).toBe(false);
  });

  it('repairs metadata whose modifiedTime is not a string', async () => {
    store['styles-metadata'] = { modifiedTime: 1700000000000 };

    await StylesMetadataUpdate();

    const metadata = store['styles-metadata'] as { modifiedTime: string };
    expect(typeof metadata.modifiedTime).toBe('string');
  });

  it('leaves already-valid metadata untouched', async () => {
    store['styles-metadata'] = { modifiedTime: '2024-01-01T00:00:00.000Z' };

    await StylesMetadataUpdate();

    expect(chrome.storage.local.set).not.toBeCalled();
    expect(store['styles-metadata']).toEqual({
      modifiedTime: '2024-01-01T00:00:00.000Z',
    });
  });
});
