<template>
  <div class="chat-error" role="alert">
    <div class="chat-error-copy">
      <s-text size="label" class="chat-error-text">{{ t(error.key) }}</s-text>
      <s-text
        v-if="error.detail"
        size="caption"
        variant="muted"
        class="chat-error-detail"
      >
        {{ error.detail }}
      </s-text>
    </div>
    <s-button size="small" @click="retry">{{ t('try_again') }}</s-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SButton, SText } from '@stylebot/components';

import type { ChatError } from '../../store/chat';

export default Vue.extend({
  name: 'ChatError',

  components: {
    SButton,
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
  gap: 8px;
  padding: 11px 12px;
  border: 1px solid var(--danger-border);
  border-radius: 10px;
  background: var(--danger-background);
}

.chat-error-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chat-error-copy .chat-error-text {
  font-weight: 600;
}

.chat-error-detail {
  overflow-wrap: anywhere;
}
</style>
