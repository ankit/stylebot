import {
  ChatProviderError,
  getModel,
  getProvider,
  getProviderInfo,
} from '@stylebot/chat';

import type {
  ChatConnectResponse,
  ChatProviderId,
  ChatStatus,
} from '@stylebot/types';

/*
 * Kept apart from `options`, which every content script receives, and not
 * uploaded by sync. One entry per value, so each write is a single set.
 */
const ACTIVE_PROVIDER = 'chat-provider';
const DEFAULT_PROVIDER: ChatProviderId = 'anthropic';

const getApiKey = (provider: ChatProviderId) => `chat-api-key-${provider}`;
const getModelKey = (provider: ChatProviderId) => `chat-model-${provider}`;

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

export const getChatStatus = async (): Promise<ChatStatus> => {
  const provider = await readActiveProvider();
  const apiKey = getApiKey(provider);
  const modelKey = getModelKey(provider);
  const items = await chrome.storage.local.get([apiKey, modelKey]);
  const storedKey: string | undefined = items[apiKey];

  return {
    connected: !!storedKey,
    provider,
    model: getModel(provider, items[modelKey] ?? '').id,
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
