import { getLocalStylesMetadata } from './sync-metadata';

describe('getLocalStylesMetadata', () => {
  let store: Record<string, unknown>;

  beforeEach(() => {
    jest.resetModules();

    store = {};

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(
            (key: string, callback: (items: Record<string, unknown>) => void) => {
              setTimeout(() => callback({ [key]: store[key] }), 0);
            }
          ),
          set: jest.fn(),
        },
      },
    } as unknown as typeof chrome;
  });

  it('returns a correctly shaped value as-is', async () => {
    store['styles-metadata'] = { modifiedTime: '2021-04-02T10:15:30.000+00:00' };

    await expect(getLocalStylesMetadata()).resolves.toEqual({
      modifiedTime: '2021-04-02T10:15:30.000+00:00',
    });
  });

  it('normalizes a legacy bare timestamp string', async () => {
    store['styles-metadata'] = '2021-04-02T10:15:30.000+00:00';

    await expect(getLocalStylesMetadata()).resolves.toEqual({
      modifiedTime: '2021-04-02T10:15:30.000+00:00',
    });
  });

  it('falls back to the epoch when the key is missing', async () => {
    await expect(getLocalStylesMetadata()).resolves.toEqual({
      modifiedTime: new Date(0).toISOString(),
    });
  });
});
