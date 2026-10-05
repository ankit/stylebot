import type { ChatAssistantTurn, ChatTurn } from '@stylebot/types';

import { estimateCost } from './cost';
import { chatProviders } from './providers';

const reply = (
  model: string,
  usage?: ChatAssistantTurn['usage']
): ChatAssistantTurn => ({
  role: 'assistant',
  id: model,
  text: '',
  edits: [],
  previous: [],
  applied: true,
  model,
  usage,
});

describe('estimateCost', () => {
  it('prices input, output and cache tokens at the model’s rates', () => {
    const turns: Array<ChatTurn> = [
      reply('claude-sonnet-5-5', {
        inputTokens: 1_000_000,
        outputTokens: 100_000,
        cacheReadTokens: 1_000_000,
        cacheWriteTokens: 1_000_000,
      }),
    ];

    // 2 + 1 + 0.2 + 2.5
    expect(estimateCost(turns)).toBeCloseTo(5.7);
  });

  it('sums replies across models and providers', () => {
    expect(
      estimateCost([
        reply('claude-haiku-4-5', { inputTokens: 1_000_000, outputTokens: 0 }),
        reply('gpt-6-luna', { inputTokens: 0, outputTokens: 1_000_000 }),
      ])
    ).toBeCloseTo(1.5);
  });

  it('skips replies without usage or with a model it has no price for', () => {
    expect(
      estimateCost([
        reply('claude-opus-5-5'),
        reply('retired-model', { inputTokens: 1_000_000, outputTokens: 0 }),
      ])
    ).toBeNull();
  });

  it('has a price for every model offered', () => {
    const unpriced = chatProviders
      .flatMap(provider => provider.models)
      .filter(model => !model.pricing)
      .map(model => model.id);

    expect(unpriced).toEqual([]);
  });
});
