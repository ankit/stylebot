import type {
  ChatModel,
  ChatProviderId,
  ChatProviderInfo,
} from '@stylebot/types';

import { anthropic } from './anthropic';

export const chatProviders: Array<ChatProviderInfo> = [anthropic];

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
