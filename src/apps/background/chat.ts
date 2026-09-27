import {
  CHAT_PORT,
  ChatProviderError,
  chatProviders,
  getModel,
  getProvider,
  getProviderInfo,
} from '@stylebot/chat';

import type {
  ChatConnectResponse,
  ChatModel,
  ChatProviderId,
  ChatStatus,
  ChatStreamEvent,
  ChatStreamRequest,
  ChatTurn,
} from '@stylebot/types';

/*
 * Kept apart from `options`, which every content script receives, and not
 * uploaded by sync. One entry per value, so each write is a single set.
 */
const ACTIVE_PROVIDER = 'chat-provider';
const DEFAULT_PROVIDER: ChatProviderId = 'anthropic';
const MAX_TURNS = 50;

const getApiKey = (provider: ChatProviderId) => `chat-api-key-${provider}`;
const getModelKey = (provider: ChatProviderId) => `chat-model-${provider}`;
const getThreadKey = (url: string) => `chat-thread-${url}`;

/**
 * The key with its middle hidden: the prefix that names the key's kind
 * (`sk-ant-api03-`) and its last four characters.
 */
export const maskKey = (key: string): string => {
  if (key.length <= 14) {
    return '••••••••';
  }

  const prefix = key.match(/^sk-(ant-[a-z0-9]+-)?/)?.[0] ?? '';
  return `${prefix}••••••••${key.slice(-4)}`;
};

type ProviderSettings = {
  id: ChatProviderId;
  storedKey?: string;
  model: ChatModel;
};

/**
 * Every provider's key and model, and the one replies come from: the
 * provider last picked while it has a key, else the first that does.
 */
const readSettings = async (): Promise<{
  active: ProviderSettings;
  providers: Array<ProviderSettings>;
}> => {
  const items = await chrome.storage.local.get([
    ACTIVE_PROVIDER,
    ...chatProviders.flatMap(({ id }) => [getApiKey(id), getModelKey(id)]),
  ]);

  const providers = chatProviders.map(({ id }) => ({
    id,
    storedKey: items[getApiKey(id)] as string | undefined,
    model: getModel(id, items[getModelKey(id)] ?? ''),
  }));

  const pickedId = items[ACTIVE_PROVIDER] ?? DEFAULT_PROVIDER;
  const picked = providers.find(({ id }) => id === pickedId) ?? providers[0];
  const firstConnected = providers.find(({ storedKey }) => storedKey);

  if (picked.storedKey || !firstConnected) {
    return { active: picked, providers };
  }

  return { active: firstConnected, providers };
};

export const getChatStatus = async (): Promise<ChatStatus> => {
  const { active, providers } = await readSettings();

  return {
    connected: !!active.storedKey,
    provider: active.id,
    model: active.model.id,
    providers: providers.map(({ id, storedKey, model }) => ({
      id,
      connected: !!storedKey,
      model: model.id,
      maskedKey: storedKey ? maskKey(storedKey) : undefined,
    })),
  };
};

/**
 * Checks the key with the provider and, if it works, stores it. The
 * provider becomes the one replies come from only when no other is
 * connected.
 */
export const connectChat = async (
  provider: ChatProviderId,
  rawKey: string
): Promise<ChatConnectResponse> => {
  const key = rawKey.trim();
  const info = getProviderInfo(provider);

  if (info.keyPrefix && !key.startsWith(info.keyPrefix)) {
    return { ok: false, errorKey: 'chat_error_wrong_provider_key' };
  }

  try {
    await getProvider(provider).validateKey(key);
  } catch (e) {
    return e instanceof ChatProviderError
      ? { ok: false, errorKey: e.errorKey, errorDetail: e.detail }
      : { ok: false, errorKey: 'chat_error_provider' };
  }

  const { active } = await readSettings();
  const apiKey = getApiKey(provider);

  await chrome.storage.local.set({
    [apiKey]: key,
    ...(active.storedKey ? {} : { [ACTIVE_PROVIDER]: provider }),
  });

  return { ok: true, status: await getChatStatus() };
};

/**
 * Forgets a provider's key. Replies then come from another connected
 * provider, if there is one.
 */
export const removeChatKey = async (
  provider: ChatProviderId
): Promise<ChatStatus> => {
  const apiKey = getApiKey(provider);

  await chrome.storage.local.remove(apiKey);
  return getChatStatus();
};

/**
 * Makes the provider the one replies come from, with the given model.
 */
export const setChatModel = async (
  provider: ChatProviderId,
  model: string
): Promise<ChatStatus> => {
  const modelKey = getModelKey(provider);

  await chrome.storage.local.set({
    [ACTIVE_PROVIDER]: provider,
    [modelKey]: getModel(provider, model).id,
  });
  return getChatStatus();
};

export const getChatThread = async (url: string): Promise<Array<ChatTurn>> => {
  const threadKey = getThreadKey(url);
  const items = await chrome.storage.local.get(threadKey);
  return items[threadKey] ?? [];
};

/**
 * Stores the site's thread, keeping only its latest turns; an empty thread
 * is removed.
 */
export const setChatThread = async (
  url: string,
  turns: Array<ChatTurn>
): Promise<void> => {
  const threadKey = getThreadKey(url);

  if (turns.length) {
    await chrome.storage.local.set({ [threadKey]: turns.slice(-MAX_TURNS) });
  } else {
    await chrome.storage.local.remove(threadKey);
  }
};

/**
 * Streams one reply to the editor over its port. Closing the port (the
 * editor closed, or the user started over) cancels the request.
 */
const streamReply = async (
  port: chrome.runtime.Port,
  request: ChatStreamRequest,
  signal: AbortSignal
): Promise<void> => {
  const post = (event: ChatStreamEvent) => {
    try {
      port.postMessage(event);
    } catch {
      // The editor went away mid-reply.
    }
  };

  const { active } = await readSettings();

  if (!active.storedKey) {
    post({ type: 'error', errorKey: 'chat_error_not_connected' });
    return;
  }

  await getProvider(active.id).stream({
    key: active.storedKey,
    model: active.model,
    system: request.system,
    turns: request.turns,
    signal,
    onEvent: post,
  });
};

/**
 * Handles chat ports from the editor. Registered synchronously with the
 * other listeners; an open port also keeps the service worker alive while
 * a reply streams.
 */
export const initChatPort = (): void => {
  chrome.runtime.onConnect.addListener(port => {
    if (port.name !== CHAT_PORT) {
      return;
    }

    const controller = new AbortController();
    port.onDisconnect.addListener(() => controller.abort());

    port.onMessage.addListener((message: ChatStreamRequest) => {
      if (message.type === 'send') {
        streamReply(port, message, controller.signal);
      }
    });
  });
};
