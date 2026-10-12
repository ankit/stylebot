import ChatOptionUpdate from './chat-option-update';

let store: Record<string, unknown>;

beforeEach(() => {
  store = {};

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (key: string | null) =>
          key === null ? { ...store } : { [key]: store[key] }
        ),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
      },
    },
  } as unknown as typeof chrome;
});

describe('ChatOptionUpdate', () => {
  it('keeps Chat shown for a user with a saved API key', async () => {
    store['options'] = { mode: 'basic' };
    store['chat-api-key-anthropic'] = 'sk-ant-key';

    await ChatOptionUpdate();

    expect(store['options']).toEqual({ mode: 'basic', chat: true });
  });

  it('keeps Chat shown for a user with a chat thread', async () => {
    store['options'] = { mode: 'code' };
    store['chat-thread-example.com'] = [];

    await ChatOptionUpdate();

    expect(store['options']).toEqual({ mode: 'code', chat: true });
  });

  it('keeps Chat shown for a user who left the editor on Chat', async () => {
    store['options'] = { mode: 'chat' };

    await ChatOptionUpdate();

    expect(store['options']).toEqual({ mode: 'chat', chat: true });
  });

  it('hides Chat for a user who never used it', async () => {
    store['options'] = { mode: 'basic' };

    await ChatOptionUpdate();

    expect(store['options']).toEqual({ mode: 'basic', chat: false });
  });

  it('leaves the option alone once it is set', async () => {
    store['options'] = { mode: 'basic', chat: false };
    store['chat-api-key-anthropic'] = 'sk-ant-key';

    await ChatOptionUpdate();

    expect(store['options']).toEqual({ mode: 'basic', chat: false });
  });

  it('does nothing on a fresh install', async () => {
    await ChatOptionUpdate();

    expect(store['options']).toBeUndefined();
  });
});
