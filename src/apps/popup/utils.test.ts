import { getCommands, getOption, getStyles, onEnterOrSpace } from './utils';

const keydown = (key: string): KeyboardEvent =>
  new KeyboardEvent('keydown', { key });

describe('onEnterOrSpace', () => {
  it('should call the handler and prevent default on Enter', () => {
    const event = keydown('Enter');
    const preventDefault = jest.spyOn(event, 'preventDefault');
    const handler = jest.fn();

    onEnterOrSpace(event, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('should call the handler and prevent default on Space', () => {
    const event = keydown(' ');
    const preventDefault = jest.spyOn(event, 'preventDefault');
    const handler = jest.fn();

    onEnterOrSpace(event, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('should ignore other keys', () => {
    const event = keydown('Tab');
    const preventDefault = jest.spyOn(event, 'preventDefault');
    const handler = jest.fn();

    onEnterOrSpace(event, handler);

    expect(handler).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

describe('getStyles', () => {
  const stored = {
    'example.com': { css: 'a { color: red; }', enabled: true },
    'example.com/docs': { css: 'p { color: blue; }', enabled: false },
    'other.com': { css: 'h1 { color: green; }', enabled: true },
  };

  beforeEach(() => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((_key, cb) => cb({ styles: stored })),
        },
      },
      runtime: { sendMessage: jest.fn() },
    } as unknown as typeof chrome;
  });

  it("should read the tab's styles from storage without messaging the background", () => {
    const callback = jest.fn();

    getStyles({ url: 'https://example.com/docs' } as chrome.tabs.Tab, callback);

    const { styles, defaultStyle } = callback.mock.calls[0][0];
    expect(styles.map((style: { url: string }) => style.url)).toEqual([
      'example.com',
      'example.com/docs',
    ]);
    expect(defaultStyle.url).toBe('example.com/docs');
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});

describe('getOption and getCommands', () => {
  const mockStorage = (items: Record<string, unknown>) => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((key: string, cb) => cb({ [key]: items[key] })),
        },
      },
      runtime: { sendMessage: jest.fn() },
    } as unknown as typeof chrome;
  };

  it('should read a stored option without messaging the background', () => {
    mockStorage({ options: { appearance: 'dark' } });
    const callback = jest.fn();

    getOption('appearance', callback);

    expect(callback).toHaveBeenCalledWith('dark');
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('should fall back to the default for an option missing from storage', () => {
    mockStorage({ options: {} });
    const callback = jest.fn();

    getOption('appearance', callback);

    expect(callback).toHaveBeenCalledWith('system');
  });

  it('should read the shortcuts from the browser without messaging the background', async () => {
    mockStorage({});
    (chrome as unknown as { commands: unknown }).commands = {
      getAll: jest.fn(() =>
        Promise.resolve([
          { name: 'stylebot', shortcut: 'Alt+Shift+M' },
          { name: 'style', shortcut: '' },
          { name: 'readability', shortcut: 'Ctrl+Shift+R' },
          { name: '_execute_action', shortcut: '' },
        ])
      ),
    };
    const callback = jest.fn();

    getCommands(callback);
    await Promise.resolve();
    await Promise.resolve();

    expect(callback).toHaveBeenCalledWith({
      stylebot: 'alt+shift+m',
      style: '',
      readability: 'ctrl+shift+r',
      grayscale: '',
    });
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
