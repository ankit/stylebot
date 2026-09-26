import { getStyles, onEnterOrSpace } from './utils';

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
