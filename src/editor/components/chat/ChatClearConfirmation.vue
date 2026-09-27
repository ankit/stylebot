<template>
  <div
    class="chat-clear-confirmation"
    role="alertdialog"
    :aria-label="t('start_a_new_chat')"
  >
    <div class="chat-clear-confirmation-copy">
      <s-heading as="h3" size="sm">
        {{ t('start_a_new_chat') }}
      </s-heading>
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

import { SHeading, SButton, SText } from '@stylebot/components';

/**
 * Asks before clearing the site's conversation; its changes stay in Code.
 */
export default Vue.extend({
  name: 'ChatClearConfirmation',

  components: {
    SHeading,
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
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--warning-border);
  background: var(--warning-background);
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
