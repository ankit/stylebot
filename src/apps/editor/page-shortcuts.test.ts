import { CHROMIUM_VARIANT_KEY } from '@stylebot/utils';

import { initPageShortcuts, toCombo } from './page-shortcuts';

const press = (init: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  document.body.dispatchEvent(event);
  return event;
};

describe('toCombo', () => {
  it('names the physical key, whatever Option types', () => {
    expect(
      toCombo(
        new KeyboardEvent('keydown', {
          code: 'KeyM',
          key: 'Â',
          altKey: true,
          shiftKey: true,
        })
      )
    ).toBe('alt+shift+m');
  });

  it('orders modifiers as the browser shortcut combos do', () => {
    expect(
      toCombo(
        new KeyboardEvent('keydown', {
          code: 'Digit1',
          ctrlKey: true,
          metaKey: true,
          shiftKey: true,
        })
      )
    ).toBe('ctrl+shift+command+1');
  });

  it('ignores a modifier pressed on its own', () => {
    expect(toCombo(new KeyboardEvent('keydown', { code: 'ShiftLeft' }))).toBe(
      ''
    );
  });
});

describe('initPageShortcuts', () => {
  let sendMessage: jest.Mock;

  const init = async (arc: boolean) => {
    if (arc) {
      document.documentElement.style.setProperty('--arc-palette-title', '#fff');
    }
    initPageShortcuts();
    await jest.runAllTimersAsync();
  };

  beforeEach(() => {
    jest.useFakeTimers();
    document.documentElement.removeAttribute('style');
    jest
      .spyOn(navigator, 'userAgent', 'get')
      .mockReturnValue('Mozilla/5.0 Chrome/141.0.0.0 Safari/537.36');
    sendMessage = jest.fn(async (message: { name: string }) =>
      message.name === 'GetCommands'
        ? { stylebot: 'alt+shift+m', style: 'alt+shift+s' }
        : undefined
    );
    global.chrome = {
      runtime: { sendMessage },
      storage: {
        local: {
          get: jest.fn(async () => ({})),
          set: jest.fn(async () => undefined),
        },
      },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // First, since the listeners the Arc tests add stay on the window.
  it('leaves shortcuts to the browser elsewhere', async () => {
    await init(false);

    press({ code: 'KeyS', altKey: true, shiftKey: true });

    expect(sendMessage).not.toBeCalled();
    expect(chrome.storage.local.set).not.toBeCalled();
  });

  it('has the background carry out a shortcut pressed in Arc', async () => {
    await init(true);

    const event = press({ code: 'KeyS', altKey: true, shiftKey: true });

    expect(event.defaultPrevented).toBe(true);
    expect(sendMessage).toBeCalledWith({
      name: 'RunPageCommand',
      command: 'style',
    });
    expect(chrome.storage.local.set).toBeCalledWith({
      [CHROMIUM_VARIANT_KEY]: 'arc',
    });
  });

  it('lets other keys through in Arc', async () => {
    await init(true);

    const event = press({ code: 'KeyS', altKey: true });

    expect(event.defaultPrevented).toBe(false);
    expect(sendMessage).not.toBeCalledWith(
      expect.objectContaining({ name: 'RunPageCommand' })
    );
  });
});
