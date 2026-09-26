import type { ChatTurn } from '@stylebot/types';

const validateKey = jest.fn();

jest.mock('@stylebot/chat', () => ({
  ...jest.requireActual('@stylebot/chat'),
  getProvider: () => ({ validateKey, stream: jest.fn() }),
}));

import { ChatProviderError } from '@stylebot/chat';
import {
  connectChat,
  disconnectChat,
  getChatStatus,
  getChatThread,
  maskKey,
  setChatModel,
  setChatThread,
} from '../chat';

let store: Record<string, unknown>;

beforeEach(() => {
  validateKey.mockReset();
  store = {};

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (keys: string | Array<string>) =>
          Object.fromEntries([keys].flat().map(key => [key, store[key]]))
        ),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
        remove: jest.fn(async (key: string) => {
          delete store[key];
        }),
      },
    },
  } as unknown as typeof chrome;
});

describe('connectChat', () => {
  it('stores a working key without ever returning it', async () => {
    validateKey.mockResolvedValue(undefined);

    const response = await connectChat('anthropic', '  sk-ant-abc  ');

    expect(validateKey).toHaveBeenCalledWith('sk-ant-abc');
    expect(response).toEqual({
      ok: true,
      status: {
        connected: true,
        provider: 'anthropic',
        model: 'claude-sonnet-5',
        maskedKey: '••••••••',
      },
    });
    expect(JSON.stringify(response)).not.toContain('sk-ant-abc');
    expect(JSON.stringify(await getChatStatus())).not.toContain('sk-ant-abc');
    expect(store).toEqual({
      'chat-provider': 'anthropic',
      'chat-api-key-anthropic': 'sk-ant-abc',
    });
  });

  it("rejects another provider's key before calling the API", async () => {
    const response = await connectChat('anthropic', 'sk-proj-123');

    expect(validateKey).not.toHaveBeenCalled();
    expect(response).toEqual({
      ok: false,
      errorKey: 'chat_error_wrong_provider_key',
    });
    expect(store).toEqual({});
  });

  it('passes on the error when the provider refuses the key', async () => {
    validateKey.mockRejectedValue(
      new ChatProviderError('chat_error_invalid_key', 'invalid x-api-key')
    );

    expect(await connectChat('openai', 'sk-bad')).toEqual({
      ok: false,
      errorKey: 'chat_error_invalid_key',
      errorDetail: 'invalid x-api-key',
    });
    expect((await getChatStatus()).connected).toBe(false);
  });
});

describe('model and disconnect', () => {
  it('switches models, ignores unknown ones, and forgets the key', async () => {
    validateKey.mockResolvedValue(undefined);
    await connectChat('openai', 'sk-good');

    expect((await setChatModel('gpt-5.6-luna')).model).toBe('gpt-5.6-luna');
    expect((await setChatModel('gpt-2')).model).toBe('gpt-5.6-terra');

    const status = await disconnectChat();

    expect(status).toEqual({
      connected: false,
      provider: 'openai',
      model: 'gpt-5.6-terra',
    });
    expect(JSON.stringify(store)).not.toContain('sk-good');
  });
});

describe('threads', () => {
  const turn = (id: string): ChatTurn => ({ role: 'user', id, text: id });

  it('keeps one thread per site and clears it when emptied', async () => {
    await setChatThread('a.com', [turn('1')]);
    await setChatThread('b.com', [turn('2')]);

    expect(await getChatThread('a.com')).toEqual([turn('1')]);
    expect(await getChatThread('c.com')).toEqual([]);

    await setChatThread('a.com', []);

    expect(store).toEqual({ 'chat-thread-b.com': [turn('2')] });
  });

  it('keeps only the latest turns', async () => {
    const turns = Array.from({ length: 60 }, (_, i) => turn(String(i)));
    await setChatThread('a.com', turns);

    const kept = await getChatThread('a.com');
    expect(kept).toHaveLength(50);
    expect(kept[0].id).toBe('10');
  });
});

describe('maskKey', () => {
  it('keeps the kind of key and its last four characters', () => {
    expect(maskKey('sk-ant-api03-Qm7vR2abcdefghijk9fK4')).toBe(
      'sk-ant-api03-••••••••9fK4'
    );
    expect(maskKey('sk-proj-abcdefghijklmnop1234')).toBe('sk-••••••••1234');
  });

  it('hides a short key entirely', () => {
    expect(maskKey('sk-ant-abc')).toBe('••••••••');
  });
});
