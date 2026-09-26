import type {
  ChatModel,
  ChatProvider,
  ChatProviderId,
  ChatProviderInfo,
} from '@stylebot/types';

import { anthropic, anthropicProvider } from './anthropic';
import { openai, openAiProvider } from './openai';

export const chatProviders: Array<ChatProviderInfo> = [anthropic, openai];

export const getProviderInfo = (id: ChatProviderId): ChatProviderInfo =>
  chatProviders.find(provider => provider.id === id) ?? anthropic;

/**
 * The model by id, falling back to the provider's default for an id it no
 * longer offers (a retired model left in storage).
 */
export const getModel = (provider: ChatProviderId, id: string): ChatModel => {
  const info = getProviderInfo(provider);

  return (
    info.models.find(model => model.id === id) ??
    info.models.find(model => model.id === info.defaultModel) ??
    info.models[0]
  );
};

const adapters: Record<ChatProviderId, ChatProvider> = {
  anthropic: anthropicProvider,
  openai: openAiProvider,
};

export const getProvider = (id: ChatProviderId): ChatProvider => adapters[id];
