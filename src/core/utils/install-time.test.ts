import { INSTALL_TIME_KEY, recordInstallTime } from './install-time';

let store: Record<string, unknown>;

beforeEach(() => {
  store = {};

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (key: string) => ({ [key]: store[key] })),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
      },
    },
  } as unknown as typeof chrome;
});

describe('recordInstallTime', () => {
  it('records the time when there is none', async () => {
    await recordInstallTime(1000);

    expect(store[INSTALL_TIME_KEY]).toBe(1000);
  });

  it('keeps an earlier install time', async () => {
    store[INSTALL_TIME_KEY] = 500;

    await recordInstallTime(1000);

    expect(store[INSTALL_TIME_KEY]).toBe(500);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
});
