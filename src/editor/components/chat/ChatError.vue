<template>
  <div class="chat-error" role="alert">
    <s-text class="chat-error-text">{{ t(error.key) }}</s-text>
    <s-text
      v-if="error.detail"
      size="small"
      variant="muted"
      class="chat-error-detail"
    >
      {{ error.detail }}
    </s-text>
    <s-link-button @click="retry">{{ t('try_again') }}</s-link-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SLinkButton, SText } from '@stylebot/components';

import type { ChatError } from '../../store/chat';

export default Vue.extend({
  name: 'ChatError',

  components: {
    SLinkButton,
    SText,
  },

  props: {
    error: {
      type: Object as PropType<ChatError>,
      required: true,
    },
  },

  methods: {
    retry(): void {
      this.$store.dispatch('chat/retry');
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--danger-border);
  border-radius: 10px;
  background: var(--danger-background);
}

.chat-error .chat-error-text {
  color: var(--danger);
}

.chat-error-detail {
  font-family: var(--font-mono);
  overflow-wrap: anywhere;
}
</style>
