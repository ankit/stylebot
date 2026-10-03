jest.mock('../commands', () => ({ set: jest.fn(async () => undefined) }));

import { set as setCommands } from '../commands';
import commandsToBrowser from './commands-to-browser';

const makeChrome = (
  items: Record<string, unknown>,
  { canUpdate }: { canUpdate: boolean }
) => {
  const store = { ...items };

  global.chrome = {
    commands: { update: canUpdate ? jest.fn() : undefined },
    storage: {
      local: {
        get: jest.fn(async (keys: Array<string>) =>
          Object.fromEntries(keys.map(key => [key, store[key]]))
        ),
        set: jest.fn(async (values: Record<string, unknown>) => {
          Object.assign(store, values);
        }),
        remove: jest.fn(async (key: string) => {
          delete store[key];
        }),
      },
    },
  } as unknown as typeof chrome;

  return store;
};

describe('commandsToBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('moves stored shortcuts into the browser where it lets Stylebot set them', async () => {
    const store = makeChrome(
      { commands: { stylebot: 'ctrl+shift+e', grayscale: 'alt+g' } },
      { canUpdate: true }
    );

    await commandsToBrowser();

    expect(setCommands).toBeCalledWith({
      stylebot: 'ctrl+shift+e',
      style: 'alt+shift+t',
      readability: '',
      grayscale: 'alt+g',
    });
    expect(store.commands).toBeUndefined();
    expect(store.migration_commands_to_browser).toBe(true);
  });

  it('only drops them where the browser keeps that to itself', async () => {
    const store = makeChrome(
      { commands: { stylebot: 'ctrl+shift+e' } },
      { canUpdate: false }
    );

    await commandsToBrowser();

    expect(setCommands).not.toBeCalled();
    expect(store.commands).toBeUndefined();
  });

  it('runs once', async () => {
    makeChrome(
      {
        commands: { stylebot: 'ctrl+shift+e' },
        migration_commands_to_browser: true,
      },
      { canUpdate: true }
    );

    await commandsToBrowser();

    expect(setCommands).not.toBeCalled();
  });
});
