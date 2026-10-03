import type { ChatTurn } from '@stylebot/types';

import { findModel } from './providers';

/**
 * What a thread's replies cost at their models' list prices, in USD, or
 * null when none of them has both usage and a priced model.
 */
export const estimateCost = (turns: Array<ChatTurn>): number | null => {
  let cost: number | null = null;

  turns.forEach(turn => {
    if (turn.role !== 'assistant' || !turn.usage) {
      return;
    }

    const pricing = findModel(turn.model)?.pricing;

    if (!pricing) {
      return;
    }

    const { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens } =
      turn.usage;
    const perMillion =
      inputTokens * pricing.input +
      outputTokens * pricing.output +
      (cacheReadTokens ?? 0) * pricing.cacheRead +
      (cacheWriteTokens ?? 0) * (pricing.cacheWrite ?? pricing.input);

    cost = (cost ?? 0) + perMillion / 1_000_000;
  });

  return cost;
};
