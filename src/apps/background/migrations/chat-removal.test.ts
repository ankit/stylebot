import ChatRemoval from './chat-removal';

let store: Record<string, unknown>;

beforeEach(() => {
  store = {};

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (keys: Array<string> | null) =>
          keys === null
            ? { ...store }
            : Object.fromEntries(
                keys.filter(key => key in store).map(key => [key, store[key]])
              )
        ),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
        remove: jest.fn(async (keys: Array<string>) => {
          keys.forEach(key => delete store[key]);
        }),
      },
    },
  } as unknown as typeof chrome;
});

describe('ChatRemoval', () => {
  it("removes Chat's keys, models, provider and threads", async () => {
    store['chat-api-key-anthropic'] = 'sk-ant-key';
    store['chat-model-openai'] = 'gpt';
    store['chat-provider'] = 'anthropic';
    store['chat-thread-example.com'] = [];
    store['styles'] = {};

    await ChatRemoval();

    expect(store).toEqual({ styles: {}, migration_chat_removal: true });
  });

  it('opens Basic for an editor left on Chat', async () => {
    store['options'] = { mode: 'chat', contextMenu: true };

    await ChatRemoval();

    expect(store['options']).toEqual({ mode: 'basic', contextMenu: true });
  });

  it('leaves a user who never used Chat alone', async () => {
    store['options'] = { mode: 'basic' };

    await ChatRemoval();

    expect(store).toEqual({
      options: { mode: 'basic' },
      migration_chat_removal: true,
    });
    expect(chrome.storage.local.remove).not.toHaveBeenCalled();
  });

  it('skips reading all of storage once it has run', async () => {
    store['migration_chat_removal'] = true;
    store['chat-provider'] = 'anthropic';

    await ChatRemoval();

    expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
    expect(chrome.storage.local.get).not.toHaveBeenCalledWith(null);
    expect(store['chat-provider']).toBe('anthropic');
  });
});
