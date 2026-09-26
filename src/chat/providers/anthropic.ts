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
      requestOptions: { output_config: { effort: 'low' } },
    },
    {
      id: 'claude-haiku-4-5',
      name: 'Claude Haiku 4.5',
      tier: 'fastest',
    },
    {
      id: 'claude-opus-5',
      name: 'Claude Opus 5',
      tier: 'best',
      requestOptions: { output_config: { effort: 'medium' } },
    },
  ],
};
