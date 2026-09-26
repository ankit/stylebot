<template>
  <div class="chat-change-key">
    <div class="chat-change-key-bar">
      <s-button variant="ghost" size="small" @click="$emit('close')">
        <chevron-left-icon :size="12" />
        {{ t('back_to_chat') }}
      </s-button>
    </div>

    <form class="chat-change-key-body" @submit.prevent="replace">
      <div class="chat-change-key-intro">
        <heading as="h2" size="md">{{ t('api_key') }}</heading>
        <s-text variant="muted">{{ t('chat_billed_to_this_key') }}</s-text>
      </div>

      <chat-connected-key />

      <chat-provider-key
        v-model="key"
        :provider.sync="provider"
        :label="t('new_key')"
      />

      <div class="chat-change-key-actions">
        <s-button
          class="chat-change-key-replace"
          variant="primary"
          :disabled="!key.trim() || connecting"
          @click="replace"
        >
          {{ connecting ? t('checking_key') : t('replace_key') }}
        </s-button>
        <s-button @click="$emit('close')">{{ t('cancel') }}</s-button>
      </div>

      <div class="chat-change-key-spacer" />

      <div class="chat-change-key-remove">
        <s-button variant="danger" size="small" @click="remove">
          {{ t('remove_key') }}
        </s-button>
        <s-text size="caption" variant="muted">
          {{ t('remove_key_description') }}
        </s-text>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { Heading, SButton, SText } from '@stylebot/components';
import { ChevronLeftIcon } from '@stylebot/icons';
import type { ChatProviderId } from '@stylebot/types';

import ChatConnectedKey from './ChatConnectedKey.vue';
import ChatProviderKey from './ChatProviderKey.vue';

/**
 * The connected key: its provider and usage, replacing it, or removing it.
 */
export default Vue.extend({
  name: 'ChatChangeKey',

  components: {
    ChatConnectedKey,
    ChatProviderKey,
    ChevronLeftIcon,
    Heading,
    SButton,
    SText,
  },

  data(): { provider: ChatProviderId; key: string } {
    return {
      provider: this.$store.state.chat.status.provider,
      key: '',
    };
  },

  computed: {
    connecting(): boolean {
      return this.$store.state.chat.connecting;
    },
  },

  methods: {
    async replace(): Promise<void> {
      const connected = await this.$store.dispatch('chat/connect', {
        provider: this.provider,
        key: this.key,
      });

      if (connected) {
        this.$emit('close');
      }
    },

    async remove(): Promise<void> {
      await this.$store.dispatch('chat/disconnect');
      this.$emit('close');
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-change-key {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-change-key-bar {
  flex: none;
  display: flex;
  align-items: center;
  padding: 6px 12px 6px 8px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--tab-surface);
}

.chat-change-key-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 22px 18px 18px;
}

.chat-change-key-intro {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-change-key-actions {
  display: flex;
  gap: 8px;
}

.chat-change-key-replace {
  flex: 1;
}

.chat-change-key-spacer {
  flex: 1;
}

.chat-change-key-remove {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding-top: 14px;
  border-top: 1px solid var(--panel-border);
}
</style>
