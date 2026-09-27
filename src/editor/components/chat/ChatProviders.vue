<template>
  <div class="chat-providers">
    <div class="chat-providers-bar">
      <s-button
        variant="ghost"
        size="small"
        class="chat-providers-back"
        @click="$emit('close')"
      >
        <chevron-left-icon :size="12" />
        {{ t('back_to_chat') }}
      </s-button>
    </div>

    <div class="chat-providers-body">
      <div class="chat-providers-intro">
        <heading as="h2" size="md">
          {{ t('providers') }}
        </heading>
        <s-text variant="muted">
          {{ t('add_a_key_for_each_provider') }}
        </s-text>
      </div>

      <chat-provider-card
        v-for="provider in providers"
        :key="provider.id"
        :provider="provider"
        :editing="editing === provider.id"
        @add="add(provider.id)"
        @cancel="editing = null"
      />

      <s-text size="caption" variant="muted">
        {{ t('keys_are_saved_on_this_computer_only') }}
      </s-text>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { Heading, SButton, SText } from '@stylebot/components';
import { ChevronLeftIcon } from '@stylebot/icons';
import type { ChatProviderId, ChatProviderStatus } from '@stylebot/types';

import ChatProviderCard from './ChatProviderCard.vue';

/**
 * Every provider, connected ones first: their keys, and adding or removing
 * one. Removing the last key turns Chat off.
 */
export default Vue.extend({
  name: 'ChatProviders',

  components: {
    ChatProviderCard,
    ChevronLeftIcon,
    Heading,
    SButton,
    SText,
  },

  data(): { editing: ChatProviderId | null } {
    return {
      editing: null,
    };
  },

  computed: {
    providers(): Array<ChatProviderStatus> {
      const providers: Array<ChatProviderStatus> =
        this.$store.state.chat.status.providers;

      return [
        ...providers.filter(({ connected }) => connected),
        ...providers.filter(({ connected }) => !connected),
      ];
    },
  },

  methods: {
    add(provider: ChatProviderId): void {
      this.$store.dispatch('chat/clearConnectError');
      this.editing = provider;
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-providers {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-providers-bar {
  flex: none;
  display: flex;
  align-items: center;
  padding: 6px 18px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--tab-surface);
}

.chat-providers-bar .chat-providers-back {
  margin-left: -14px;
}

.chat-providers-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 18px 18px;
}

.chat-providers-intro {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
