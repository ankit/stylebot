import type { ChatUsage } from '@stylebot/types';
import type { ChatModel } from '@stylebot/types';

export const costOf = (model: ChatModel, usage: ChatUsage): number =>
  (usage.inputTokens * model.inputPrice +
    usage.outputTokens * model.outputPrice +
    (usage.cacheReadTokens ?? 0) * model.cacheReadPrice +
    (usage.cacheWriteTokens ?? 0) * model.cacheWritePrice) /
  1_000_000;

/**
 * Cents below ten cents, to a tenth of a cent under ten, so a single reply
 * still reads as more than nothing; dollars from there up.
 */
export const formatMoney = (value: number): string => {
  if (!value) {
    return '0¢';
  }

  if (value < 0.1) {
    const cents = value * 100;
    return `${
      cents < 10 ? cents.toFixed(1).replace(/\.0$/, '') : Math.round(cents)
    }¢`;
  }

  return `$${value.toFixed(2)}`;
};
