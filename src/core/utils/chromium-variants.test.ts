import {
  CHROMIUM_VARIANT_KEY,
  detectChromiumVariant,
  getChromiumVariant,
  doShortcutsWorkInChromiumVariant,
  doesSidePanelWorkInChromiumVariant,
} from './chromium-variants';

let store: Record<string, unknown>;

beforeEach(() => {
  jest.useFakeTimers();
  document.documentElement.removeAttribute('style');
  jest
    .spyOn(navigator, 'userAgent', 'get')
    .mockReturnValue('Mozilla/5.0 Chrome/141.0.0.0 Safari/537.36');
  store = {};
  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (keys: Array<string>) =>
          Object.fromEntries(keys.map(key => [key, store[key]]))
        ),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
      },
    },
  } as unknown as typeof chrome;
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('what each variant breaks', () => {
  it('works the side panel everywhere but Vivaldi and Arc', () => {
    expect(doesSidePanelWorkInChromiumVariant(undefined)).toBe(true);
    expect(doesSidePanelWorkInChromiumVariant('vivaldi')).toBe(false);
    expect(doesSidePanelWorkInChromiumVariant('arc')).toBe(false);
  });

  it('passes shortcuts on everywhere but Arc', () => {
    expect(doShortcutsWorkInChromiumVariant(undefined)).toBe(true);
    expect(doShortcutsWorkInChromiumVariant('vivaldi')).toBe(true);
    expect(doShortcutsWorkInChromiumVariant('arc')).toBe(false);
  });
});

describe('getChromiumVariant', () => {
  it('reads Vivaldi as 4.0 recorded it', async () => {
    store = { sidePanelIgnoresTabs: true };
    await expect(getChromiumVariant()).resolves.toBe('vivaldi');
  });
});

describe('detectChromiumVariant', () => {
  it('finds and remembers Arc once it adds its palette', async () => {
    const found = detectChromiumVariant();
    await jest.advanceTimersByTimeAsync(500);
    document.documentElement.style.setProperty('--arc-palette-title', '#fff');
    await jest.advanceTimersByTimeAsync(500);

    await expect(found).resolves.toBe('arc');
    expect(store[CHROMIUM_VARIANT_KEY]).toBe('arc');
  });

  it('leaves storage alone when Arc is already known', async () => {
    store = { [CHROMIUM_VARIANT_KEY]: 'arc' };
    document.documentElement.style.setProperty('--arc-palette-title', '#fff');

    await expect(detectChromiumVariant()).resolves.toBe('arc');
    expect(chrome.storage.local.set).not.toBeCalled();
  });

  it('finds and remembers Vivaldi by the data it adds to windows', async () => {
    (chrome as unknown as { windows: unknown }).windows = {
      getAll: jest.fn(async () => [{ id: 1, vivExtData: '{}' }]),
    };

    await expect(detectChromiumVariant()).resolves.toBe('vivaldi');
    expect(store[CHROMIUM_VARIANT_KEY]).toBe('vivaldi');
  });

  it('answers with Vivaldi in a page once the background has found it', async () => {
    store = { [CHROMIUM_VARIANT_KEY]: 'vivaldi' };

    await expect(detectChromiumVariant()).resolves.toBe('vivaldi');
  });

  it('finds nothing in other browsers', async () => {
    const found = detectChromiumVariant();
    await jest.advanceTimersByTimeAsync(3000);

    await expect(found).resolves.toBeUndefined();
    expect(chrome.storage.local.set).not.toBeCalled();
  });
});
