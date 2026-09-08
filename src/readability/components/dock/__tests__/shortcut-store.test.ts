export {};

jest.mock('../../../utils/get-commands');
jest.mock('../../../utils/set-commands');

const commands = (readability: string) => ({
  readability,
  style: '',
  stylebot: '',
  grayscale: '',
});

describe('shortcutStore', () => {
  let getCommandsModule: typeof import('../../../utils/get-commands');
  let setCommandsModule: typeof import('../../../utils/set-commands');
  let shortcutStore: typeof import('../shortcut-store').shortcutStore;

  beforeEach(() => {
    jest.resetModules();

    getCommandsModule = require('../../../utils/get-commands');
    setCommandsModule = require('../../../utils/set-commands');
    (getCommandsModule.getCommands as jest.Mock).mockResolvedValue(commands(''));

    ({ shortcutStore } = require('../shortcut-store'));
  });

  it('fetches commands once and memoizes the promise', async () => {
    await shortcutStore.ensureLoaded();
    await shortcutStore.ensureLoaded();

    expect(getCommandsModule.getCommands).toHaveBeenCalledTimes(1);
  });

  it('value is empty before load and reflects the fetched shortcut after', async () => {
    expect(shortcutStore.value).toBe('');

    (getCommandsModule.getCommands as jest.Mock).mockResolvedValue(commands('alt+shift+r'));
    await shortcutStore.ensureLoaded();

    expect(shortcutStore.value).toBe('alt+shift+r');
  });

  it('tooltip invites setting a shortcut when unset', () => {
    expect(shortcutStore.tooltip).toBe('Set a shortcut to toggle readability on a site');
  });

  it('tooltip includes the formatted shortcut when set', async () => {
    (getCommandsModule.getCommands as jest.Mock).mockResolvedValue(commands('alt+shift+r'));
    await shortcutStore.ensureLoaded();

    // formatShortcut's own mac/non-mac rendering is covered separately —
    // just assert the store weaves its output into the sentence.
    expect(shortcutStore.tooltip).toMatch(/^Modify shortcut \(.+\) to toggle readability on a site$/);
  });

  it('setRecording updates state.recording', () => {
    expect(shortcutStore.state.recording).toBe(false);

    shortcutStore.setRecording(true);
    expect(shortcutStore.state.recording).toBe(true);
  });

  it('update() is a no-op before commands have loaded', () => {
    shortcutStore.update('alt+shift+r');

    expect(setCommandsModule.setCommands).not.toHaveBeenCalled();
  });

  it('update() persists the merged commands after load', async () => {
    await shortcutStore.ensureLoaded();

    shortcutStore.update('alt+shift+r');

    expect(shortcutStore.value).toBe('alt+shift+r');
    expect(setCommandsModule.setCommands).toHaveBeenCalledWith(commands('alt+shift+r'));
  });
});
