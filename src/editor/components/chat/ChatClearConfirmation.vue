<template>
  <div
    class="chat-clear-confirmation"
    role="alertdialog"
    aria-labelledby="chat-clear-confirmation-title"
  >
    <div class="chat-clear-confirmation-copy">
      <heading id="chat-clear-confirmation-title" as="h3" size="sm">
        {{ t('start_a_new_chat') }}
      </heading>
      <s-text variant="muted">{{ t('new_chat_clears_conversation') }}</s-text>
    </div>
    <div class="chat-clear-confirmation-actions">
      <s-button
        ref="confirm"
        variant="primary"
        size="small"
        @click="$emit('confirm')"
      >
        {{ t('clear_chat') }}
      </s-button>
      <s-button size="small" @click="$emit('cancel')">
        {{ t('cancel') }}
      </s-button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { Heading, SButton, SText } from '@stylebot/components';

/**
 * Asks before clearing the site's conversation; its changes stay in Code.
 */
export default Vue.extend({
  name: 'ChatClearConfirmation',

  components: {
    Heading,
    SButton,
    SText,
  },

  mounted() {
    ((this.$refs.confirm as Vue).$el as HTMLElement).focus();
  },
});
</script>

<style lang="scss" scoped>
.chat-clear-confirmation {
  --chat-clear-confirmation-surface: #fff8ec;
  --chat-clear-confirmation-border: #f1e3c6;

  flex: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--chat-clear-confirmation-border);
  background: var(--chat-clear-confirmation-surface);

  @include dark-mode {
    --chat-clear-confirmation-surface: #2b2518;
    --chat-clear-confirmation-border: #4a3d22;
  }
}

.chat-clear-confirmation-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chat-clear-confirmation-actions {
  display: flex;
  gap: 8px;
}
</style>
