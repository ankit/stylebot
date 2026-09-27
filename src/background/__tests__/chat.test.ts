import type { ChatStatus, ChatTurn } from '@stylebot/types';

const validateKey = jest.fn();

jest.mock('@stylebot/chat', () => ({
  ...jest.requireActual('@stylebot/chat'),
  getProvider: () => ({ validateKey, stream: jest.fn() }),
}));

import { ChatProviderError } from '@stylebot/chat';
import {
  connectChat,
  removeChatKey,
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
    expect(response).toMatchObject({
      ok: true,
      status: {
        connected: true,
        provider: 'anthropic',
        model: 'claude-sonnet-5',
      },
    });
    expect(response.ok && response.status.providers[0]).toEqual({
      id: 'anthropic',
      connected: true,
      model: 'claude-sonnet-5',
      maskedKey: '••••••••',
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

describe('several providers', () => {
  beforeEach(() => validateKey.mockResolvedValue(undefined));

  const connectedIds = (status: ChatStatus) =>
    status.providers.filter(({ connected }) => connected).map(({ id }) => id);

  it('keeps replying from the first provider when another is added', async () => {
    await connectChat('openai', 'sk-good');
    const status = await connectChat('anthropic', 'sk-ant-good');

    expect(status.ok && status.status.provider).toBe('openai');
    expect(status.ok && connectedIds(status.status)).toEqual([
      'anthropic',
      'openai',
    ]);
  });

  it('switches provider and model together, ignoring unknown models', async () => {
    await connectChat('openai', 'sk-good');
    await connectChat('anthropic', 'sk-ant-good');

    expect(await setChatModel('anthropic', 'claude-opus-5')).toMatchObject({
      provider: 'anthropic',
      model: 'claude-opus-5',
    });
    expect((await setChatModel('openai', 'gpt-2')).model).toBe('gpt-5.6-terra');
  });

  it('falls back to another provider when the one in use is removed', async () => {
    await connectChat('openai', 'sk-good');
    await connectChat('anthropic', 'sk-ant-good');

    const status = await removeChatKey('openai');

    expect(status).toMatchObject({ connected: true, provider: 'anthropic' });
    expect(JSON.stringify(store)).not.toContain('sk-good');
  });

  it('turns chat off once the last key is removed', async () => {
    await connectChat('openai', 'sk-good');

    expect((await removeChatKey('openai')).connected).toBe(false);
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
