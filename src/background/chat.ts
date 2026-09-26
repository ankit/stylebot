import {
  CHAT_PORT,
  ChatProviderError,
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

const readActiveProvider = async (): Promise<ChatProviderId> => {
  const items = await chrome.storage.local.get(ACTIVE_PROVIDER);
  return items[ACTIVE_PROVIDER] ?? DEFAULT_PROVIDER;
};

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

/**
 * The active provider with its stored key, if connected, and its model.
 */
const readActiveSettings = async (): Promise<{
  provider: ChatProviderId;
  storedKey?: string;
  model: ChatModel;
}> => {
  const provider = await readActiveProvider();
  const apiKey = getApiKey(provider);
  const modelKey = getModelKey(provider);
  const items = await chrome.storage.local.get([apiKey, modelKey]);

  return {
    provider,
    storedKey: items[apiKey],
    model: getModel(provider, items[modelKey] ?? ''),
  };
};

export const getChatStatus = async (): Promise<ChatStatus> => {
  const { provider, storedKey, model } = await readActiveSettings();

  return {
    connected: !!storedKey,
    provider,
    model: model.id,
    maskedKey: storedKey ? maskKey(storedKey) : undefined,
  };
};

/**
 * Checks the key with the provider and, if it works, stores it and makes
 * that provider the active one.
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

  const apiKey = getApiKey(provider);

  await chrome.storage.local.set({
    [ACTIVE_PROVIDER]: provider,
    [apiKey]: key,
  });

  return { ok: true, status: await getChatStatus() };
};

/**
 * Forgets the active provider's key.
 */
export const disconnectChat = async (): Promise<ChatStatus> => {
  const provider = await readActiveProvider();
  const apiKey = getApiKey(provider);

  await chrome.storage.local.remove(apiKey);
  return getChatStatus();
};

export const setChatModel = async (model: string): Promise<ChatStatus> => {
  const provider = await readActiveProvider();
  const modelKey = getModelKey(provider);

  await chrome.storage.local.set({ [modelKey]: getModel(provider, model).id });
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

  const { provider, storedKey, model } = await readActiveSettings();

  if (!storedKey) {
    post({ type: 'error', errorKey: 'chat_error_not_connected' });
    return;
  }

  await getProvider(provider).stream({
    key: storedKey,
    model,
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
