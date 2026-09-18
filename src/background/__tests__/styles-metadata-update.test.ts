import StylesMetadataUpdate from '../styles-metadata-update';

describe('StylesMetadataUpdate', () => {
  let store: Record<string, unknown>;
  let set: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    store = {};

    set = jest.fn((items: Record<string, unknown>, callback?: () => void) => {
      setTimeout(() => {
        Object.assign(store, items);
        callback?.();
      }, 0);
    });

    global.chrome = {
      storage: {
        local: {
          get: jest.fn((callback: (items: Record<string, unknown>) => void) => {
            setTimeout(() => callback({ ...store }), 0);
          }),
          set,
        },
      },
    } as unknown as typeof chrome;
  });

  it('writes the object form when the key is absent', async () => {
    await StylesMetadataUpdate();

    const stylesMetadata = store['styles-metadata'] as { modifiedTime: string };

    expect(typeof stylesMetadata.modifiedTime).toBe('string');
    expect(Number.isNaN(new Date(stylesMetadata.modifiedTime).getTime())).toBe(
      false
    );
  });

  it('repairs a legacy bare string, preserving the original timestamp', async () => {
    store['styles-metadata'] = '2021-04-02T10:15:30.000+00:00';

    await StylesMetadataUpdate();

    expect(store['styles-metadata']).toEqual({
      modifiedTime: '2021-04-02T10:15:30.000+00:00',
    });
  });

  it('leaves an already correct object untouched', async () => {
    store['styles-metadata'] = { modifiedTime: '2021-04-02T10:15:30.000+00:00' };

    await StylesMetadataUpdate();

    expect(set).not.toHaveBeenCalled();
    expect(store['styles-metadata']).toEqual({
      modifiedTime: '2021-04-02T10:15:30.000+00:00',
    });
  });
});
