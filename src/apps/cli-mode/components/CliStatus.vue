<template>
  <span class="status" :class="activity ? 'busy' : agent">
    <template v-if="activity">
      <cli-spinner />
      <span class="status-text">stylebot {{ activity }}</span>
    </template>
    <template v-else>
      <span class="dot">●</span>
      <span class="status-text">{{ t(statusKey) }}</span>
    </template>
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { CliAgentStatus } from '@stylebot/types';

import CliSpinner from './CliSpinner.vue';

const STATUS_KEYS: Record<CliAgentStatus, string> = {
  awaited: 'queued_until_your_agent_runs_stylebot',
  connected: 'agent_connected',
  left: 'agent_disconnected',
};

const SHORT_STATUS_KEYS: Record<CliAgentStatus, string> = {
  awaited: 'queued',
  connected: 'agent_connected',
  left: 'agent_left',
};

/**
 * Whether an agent has been at work on the tab, or the command it's running.
 */
export default Vue.extend({
  name: 'CliStatus',

  components: { CliSpinner },

  props: {
    agent: {
      type: String as PropType<CliAgentStatus>,
      required: true,
    },

    activity: {
      type: String as PropType<string | null>,
      default: null,
    },

    // Worded to fit the collapsed pill.
    short: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    statusKey(): string {
      return (this.short ? SHORT_STATUS_KEYS : STATUS_KEYS)[this.agent];
    },
  },
});
</script>

<style lang="scss" scoped>
.status {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--term-dim);
  font-size: 12px;

  &.busy {
    color: var(--term-text);
  }
}

.dot {
  flex: none;
  color: var(--term-faint);
  font-size: 10px;

  .connected & {
    color: var(--term-green);
  }
}

.status-text {
  @include truncate;

  min-width: 0;
}
</style>
