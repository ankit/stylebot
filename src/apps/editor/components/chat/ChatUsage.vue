<template>
  <s-anchored-menu v-if="total" class="chat-usage-anchor">
    <template #trigger="{ toggle, open }">
      <button
        type="button"
        class="chat-usage-button"
        :class="{ open }"
        aria-haspopup="dialog"
        :aria-expanded="open ? 'true' : 'false'"
        @click="toggle"
      >
        {{ t('count_tokens', [format(total)]) }}
      </button>
    </template>

    <div class="chat-usage" role="dialog" :aria-label="t('this_chat')">
      <span class="chat-usage-title">{{ t('this_chat') }}</span>
      <span class="chat-usage-row">
        {{ t('input') }}
        <span class="chat-usage-value">{{ format(totals.input) }}</span>
      </span>
      <span class="chat-usage-row">
        {{ t('output') }}
        <span class="chat-usage-value">{{ format(totals.output) }}</span>
      </span>
      <span class="chat-usage-divider" />
      <span v-if="cost !== null" class="chat-usage-row chat-usage-cost">
        {{ t('est_cost') }}
        <span class="chat-usage-value">{{ formatCost(cost) }}</span>
      </span>
      <a
        class="chat-usage-link"
        :href="provider.usageUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t('provider_usage', [provider.name]) }}
        <arrow-up-right-icon :size="10" />
      </a>
    </div>
  </s-anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { SAnchoredMenu } from '@stylebot/components';
import { ArrowUpRightIcon } from '@stylebot/icons';
import { estimateCost, getProviderInfo } from '@stylebot/chat';
import type { ChatProviderInfo, ChatTurn } from '@stylebot/types';

const compact = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const dollars = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
});

/**
 * The tokens this chat has used, as the providers counted them, opening
 * onto the input / output split, an estimate of the cost at list prices,
 * and the provider's own usage page.
 */
export default Vue.extend({
  name: 'ChatUsage',

  components: {
    ArrowUpRightIcon,
    SAnchoredMenu,
  },

  computed: {
    totals(): { input: number; output: number } {
      const turns: Array<ChatTurn> = this.$store.state.chat.turns;

      return turns.reduce(
        (sum, turn) => {
          const usage = turn.role === 'assistant' ? turn.usage : undefined;

          if (usage) {
            // Cached input is still input the model read.
            sum.input +=
              usage.inputTokens +
              (usage.cacheReadTokens ?? 0) +
              (usage.cacheWriteTokens ?? 0);
            sum.output += usage.outputTokens;
          }

          return sum;
        },
        { input: 0, output: 0 }
      );
    },

    cost(): number | null {
      return estimateCost(this.$store.state.chat.turns);
    },

    total(): number {
      return this.totals.input + this.totals.output;
    },

    provider(): ChatProviderInfo {
      return getProviderInfo(this.$store.state.chat.status.provider);
    },
  },

  methods: {
    format(count: number): string {
      return compact.format(count);
    },

    formatCost(cost: number): string {
      return cost < 0.01 ? `< ${dollars.format(0.01)}` : dollars.format(cost);
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-usage-button {
  @include button-reset;

  flex: none;
  height: 26px;
  padding: 0 6px;
  border-radius: 7px;
  font-size: 12px;
  color: var(--text-faint);
  white-space: nowrap;
  cursor: pointer;

  &:hover,
  &.open {
    background: var(--hover-tint);
    color: var(--text-body);
  }

  @include focus-ring;
}

.chat-usage {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: 230px;
  padding: 12px;
  border: 1px solid var(--menu-border);
  border-radius: 10px;
  background: var(--menu-surface);
  box-shadow: 0 12px 32px var(--menu-shadow);
  font-size: 12px;
  line-height: 1;
  color: var(--text-body);
}

.chat-usage-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.chat-usage-row {
  display: flex;
  justify-content: space-between;
}

.chat-usage-value {
  font-family: var(--font-mono);
  color: var(--text-primary);
}

.chat-usage-cost,
.chat-usage-cost .chat-usage-value {
  color: var(--text-muted);
}

.chat-usage-divider {
  height: 1px;
  background: var(--menu-border);
}

.chat-usage-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  text-decoration: none;

  &:hover {
    color: var(--text-primary);
  }

  @include focus-ring(2px);
}
</style>
