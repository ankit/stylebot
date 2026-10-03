export {};

jest.mock('../../utils/get-commands');

const commands = (readability: string) => ({
  readability,
  style: '',
  stylebot: '',
  grayscale: '',
});

describe('shortcutStore', () => {
  let getCommandsModule: typeof import('../../utils/get-commands');
  let shortcutStore: typeof import('./shortcut-store').shortcutStore;
  let storageGet: jest.Mock;
  let storageSet: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    getCommandsModule = require('../../utils/get-commands');
    (getCommandsModule.getCommands as jest.Mock).mockResolvedValue(
      commands('')
    );

    storageGet = jest.fn(() => Promise.resolve({}));
    storageSet = jest.fn();
    global.chrome = {
      storage: { local: { get: storageGet, set: storageSet } },
    } as unknown as typeof chrome;

    ({ shortcutStore } = require('./shortcut-store'));
  });

  it('fetches commands once and memoizes the promise', async () => {
    await shortcutStore.ensureLoaded();
    await shortcutStore.ensureLoaded();

    expect(getCommandsModule.getCommands).toHaveBeenCalledTimes(1);
    expect(storageGet).toHaveBeenCalledTimes(1);
  });

  it('value is empty before load and reflects the fetched shortcut after', async () => {
    expect(shortcutStore.value()).toBe('');

    (getCommandsModule.getCommands as jest.Mock).mockResolvedValue(
      commands('alt+shift+r')
    );
    await shortcutStore.ensureLoaded();

    expect(shortcutStore.value()).toBe('alt+shift+r');
  });

  it('promptDismissed is false before load and reflects the stored flag after', async () => {
    expect(shortcutStore.state.promptDismissed).toBe(false);

    storageGet.mockResolvedValue({ readabilityShortcutPromptDismissed: true });
    await shortcutStore.ensureLoaded();

    expect(shortcutStore.state.promptDismissed).toBe(true);
  });

  it('dismissPrompt sets and persists the dismissed flag', () => {
    shortcutStore.dismissPrompt();

    expect(shortcutStore.state.promptDismissed).toBe(true);
    expect(storageSet).toHaveBeenCalledWith({
      readabilityShortcutPromptDismissed: true,
    });
  });
});
