import { get, set } from './commands';

/**
 * Stands in for the browser's commands. With `canUpdate`, it lets the
 * extension change them as Firefox does, rejecting shortcuts it can't take.
 */
const makeChrome = ({ canUpdate }: { canUpdate: boolean }) => {
  const shortcuts: Record<string, string> = {
    stylebot: 'Alt+Shift+M',
    style: 'Alt+Shift+T',
    readability: '',
    grayscale: '',
  };

  const api = {
    commands: {
      getAll: jest.fn(async () =>
        Object.entries(shortcuts).map(([name, shortcut]) => ({
          name,
          shortcut,
        }))
      ),
      update: canUpdate
        ? jest.fn(
            async ({ name, shortcut }: { name: string; shortcut: string }) => {
              if (shortcut === 'Alt+Space') {
                throw new Error('Reserved');
              }
              shortcuts[name] = shortcut;
            }
          )
        : undefined,
    },
  };

  global.chrome = api as unknown as typeof chrome;
  return api;
};

describe('commands', () => {
  it('reads the shortcuts from the browser', async () => {
    makeChrome({ canUpdate: false });

    expect(await get()).toEqual({
      stylebot: 'alt+shift+m',
      style: 'alt+shift+t',
      readability: '',
      grayscale: '',
    });
  });

  it('sets only the shortcuts that changed, where the browser allows it', async () => {
    const api = makeChrome({ canUpdate: true });

    const result = await set({
      stylebot: 'alt+shift+m',
      style: '',
      readability: 'ctrl+shift+r',
      grayscale: '',
    });

    expect(api.commands.update).toBeCalledTimes(2);
    expect(api.commands.update).toBeCalledWith({ name: 'style', shortcut: '' });
    expect(api.commands.update).toBeCalledWith({
      name: 'readability',
      shortcut: 'Ctrl+Shift+R',
    });
    expect(result).toEqual({
      stylebot: 'alt+shift+m',
      style: '',
      readability: 'ctrl+shift+r',
      grayscale: '',
    });
  });

  it('keeps the old shortcut when the browser rejects a new one', async () => {
    makeChrome({ canUpdate: true });

    const result = await set({
      stylebot: 'alt+space',
      style: 'alt+é',
      readability: '',
      grayscale: '',
    });

    expect(result.stylebot).toBe('alt+shift+m');
    expect(result.style).toBe('alt+shift+t');
  });

  it('only reports the shortcuts where the browser doesn’t let them change', async () => {
    makeChrome({ canUpdate: false });

    const result = await set({
      stylebot: 'ctrl+m',
      style: '',
      readability: '',
      grayscale: '',
    });

    expect(result.stylebot).toBe('alt+shift+m');
  });
});
