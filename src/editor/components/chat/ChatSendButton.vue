<template>
  <button
    v-if="pending"
    type="button"
    class="chat-send-button stop"
    :aria-label="t('stop')"
    :title="t('stop')"
    @click="$emit('stop')"
  >
    <stop-icon :size="8" />
  </button>
  <button
    v-else
    type="button"
    class="chat-send-button"
    :disabled="disabled"
    :aria-label="t('send')"
    :title="t('send')"
    @click="$emit('send')"
  >
    <arrow-up-icon :size="12" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

import { ArrowUpIcon, StopIcon } from '@stylebot/icons';

/**
 * Sends the message, or stops the reply while one streams in.
 */
export default Vue.extend({
  name: 'ChatSendButton',

  components: {
    ArrowUpIcon,
    StopIcon,
  },

  props: {
    pending: {
      type: Boolean,
      default: false,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-send-button {
  @include button-reset;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--accent);
  color: var(--accent-ink);
  cursor: pointer;

  &:hover:not(:disabled) {
    filter: brightness(0.85);
  }

  &:disabled {
    cursor: default;
    background: color-mix(in srgb, var(--text-faint) 55%, transparent);
    color: var(--panel-surface);
  }

  &.stop {
    background: var(--text-primary);
    color: var(--panel-surface);

    &:hover {
      filter: none;
      background: color-mix(
        in srgb,
        var(--text-primary) 85%,
        var(--panel-surface)
      );
    }
  }

  @include focus-ring(2px);
}
</style>
