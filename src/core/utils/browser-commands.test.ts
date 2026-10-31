import { getBrowserCommands } from './browser-commands';

describe('getBrowserCommands', () => {
  it('reads each shortcut from the browser', async () => {
    global.chrome = {
      commands: {
        getAll: jest.fn(async () => [
          { name: 'stylebot', shortcut: 'Alt+Shift+M' },
        ]),
      },
    } as unknown as typeof chrome;

    const commands = await getBrowserCommands();

    expect(commands.stylebot).not.toBe('');
    expect(commands.style).toBe('');
  });

  it('reads every shortcut as unset where the browser has no commands', async () => {
    global.chrome = {} as typeof chrome;

    await expect(getBrowserCommands()).resolves.toEqual({
      stylebot: '',
      style: '',
      readability: '',
      grayscale: '',
    });
  });
});
