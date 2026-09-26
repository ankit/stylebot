<template>
  <form class="chat-setup" @submit.prevent="connect">
    <div class="chat-setup-intro">
      <heading as="h2" size="md">{{ t('connect_a_model_to_start') }}</heading>
      <s-text variant="muted">{{ t('chat_setup_description') }}</s-text>
    </div>

    <chat-provider-key
      v-model="key"
      :provider.sync="provider"
      :label="t('api_key')"
      :help="t('api_key_saved_locally', [info.company])"
    />

    <div class="chat-setup-spacer" />

    <s-button
      class="chat-setup-connect"
      variant="primary"
      :disabled="!key.trim() || connecting"
      @click="connect"
    >
      {{ connecting ? t('checking_key') : t('connect_provider', [info.name]) }}
    </s-button>
  </form>
</template>

<script lang="ts">
import Vue from 'vue';

import { Heading, SButton, SText } from '@stylebot/components';
import { getProviderInfo } from '@stylebot/chat';
import type { ChatProviderId, ChatProviderInfo } from '@stylebot/types';

import ChatProviderKey from './ChatProviderKey.vue';

export default Vue.extend({
  name: 'ChatSetup',

  components: {
    ChatProviderKey,
    Heading,
    SButton,
    SText,
  },

  data(): { provider: ChatProviderId; key: string } {
    return {
      provider: this.$store.state.chat.status?.provider ?? 'anthropic',
      key: '',
    };
  },

  computed: {
    info(): ChatProviderInfo {
      return getProviderInfo(this.provider);
    },

    connecting(): boolean {
      return this.$store.state.chat.connecting;
    },
  },

  methods: {
    connect(): void {
      this.$store.dispatch('chat/connect', {
        provider: this.provider,
        key: this.key,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-setup {
  display: flex;
  flex-direction: column;
  gap: 26px;
  min-height: 100%;
  padding: 24px 18px 18px;
  box-sizing: border-box;
}

.chat-setup-intro {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-setup-spacer {
  flex: 1;
}

.chat-setup-connect {
  padding: 10px 0;
  border-radius: 10px;
}
</style>
