import type { ChatProviderInfo } from '@stylebot/types';

export const anthropic: ChatProviderInfo = {
  id: 'anthropic',
  name: 'Claude',
  company: 'Anthropic',
  keyPlaceholder: 'sk-ant-…',
  keyUrl: 'https://console.anthropic.com/settings/keys',
  usageUrl: 'https://console.anthropic.com/settings/usage',
  keyPrefix: 'sk-ant-',
  defaultModel: 'claude-sonnet-5',
  models: [
    {
      id: 'claude-sonnet-5',
      name: 'Claude Sonnet 5',
      tier: 'balanced',
      inputPrice: 2,
      outputPrice: 10,
      cacheReadPrice: 0.2,
      cacheWritePrice: 2.5,
      requestOptions: { output_config: { effort: 'low' } },
    },
    {
      id: 'claude-haiku-4-5',
      name: 'Claude Haiku 4.5',
      tier: 'fastest',
      inputPrice: 1,
      outputPrice: 5,
      cacheReadPrice: 0.1,
      cacheWritePrice: 1.25,
    },
    {
      id: 'claude-opus-5',
      name: 'Claude Opus 5',
      tier: 'best',
      inputPrice: 5,
      outputPrice: 25,
      cacheReadPrice: 0.5,
      cacheWritePrice: 6.25,
      requestOptions: { output_config: { effort: 'medium' } },
    },
  ],
};
