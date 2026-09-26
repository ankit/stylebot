<template>
  <div class="chat-connected-key">
    <div class="chat-connected-key-copy">
      <s-text as="span" size="label" class="chat-connected-key-provider">
        <span class="chat-connected-key-dot" />
        {{ t('connected_to_provider', [info.name]) }}
      </s-text>
      <s-text
        as="span"
        size="caption"
        variant="muted"
        class="chat-connected-key-masked"
      >
        {{ status.maskedKey }}
      </s-text>
    </div>
    <s-text
      as="a"
      size="caption"
      variant="primary"
      class="chat-connected-key-usage"
      :href="info.usageUrl"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ t('view_usage') }}
    </s-text>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SText } from '@stylebot/components';
import { getProviderInfo } from '@stylebot/chat';
import type { ChatProviderInfo, ChatStatus } from '@stylebot/types';

/**
 * The key in use: its provider, the key with its middle hidden, and a link
 * to the provider's usage page.
 */
export default Vue.extend({
  name: 'ChatConnectedKey',

  components: {
    SText,
  },

  computed: {
    status(): ChatStatus {
      return this.$store.state.chat.status;
    },

    info(): ChatProviderInfo {
      return getProviderInfo(this.status.provider);
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-connected-key {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  background: var(--tab-surface);
}

.chat-connected-key-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-connected-key .chat-connected-key-provider {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 600;
}

.chat-connected-key-dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
}

.chat-connected-key-masked {
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-connected-key-usage {
  flex: none;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring(2px);
}
</style>
