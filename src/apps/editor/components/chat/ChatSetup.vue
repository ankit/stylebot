<template>
  <form class="chat-setup" @submit.prevent="connect">
    <div class="chat-setup-intro">
      <s-heading as="h2" size="md">
        {{ t('connect_a_model_to_start') }}
      </s-heading>
      <s-text variant="muted" class="chat-setup-description">
        {{ t('chat_setup_description') }}
      </s-text>
    </div>

    <div class="chat-setup-field">
      <s-text as="span" class="chat-setup-label">{{ t('provider') }}</s-text>
      <s-segmented-control
        :value="provider"
        :options="providerOptions"
        :disabled="connecting"
        @change="pickProvider"
      />
    </div>

    <chat-key-input
      v-model="key"
      :provider="provider"
      :label="t('api_key')"
      :help="t('api_key_saved_locally', [info.company])"
    />

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

import {
  SHeading,
  SButton,
  SSegmentedControl,
  SText,
} from '@stylebot/components';
import { chatProviders, getProviderInfo } from '@stylebot/chat';
import type { ChatProviderId, ChatProviderInfo } from '@stylebot/types';

import ChatKeyInput from './ChatKeyInput.vue';

export default Vue.extend({
  name: 'ChatSetup',

  components: {
    ChatKeyInput,
    SHeading,
    SButton,
    SSegmentedControl,
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

    providerOptions(): Array<{ value: string; label: string }> {
      return chatProviders.map(provider => ({
        value: provider.id,
        label: provider.name,
      }));
    },

    connecting(): boolean {
      return this.$store.state.chat.connecting;
    },
  },

  methods: {
    pickProvider(provider: ChatProviderId): void {
      this.provider = provider;
      this.$store.dispatch('chat/clearConnectError');
    },

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
  gap: 20px;
  padding: 20px var(--panel-gutter);
  box-sizing: border-box;
}

.chat-setup-intro {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-setup-description {
  font-size: 13px;
  line-height: 1.5;
  text-wrap: pretty;
}

.chat-setup-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-setup-label {
  font-size: 13px;
  color: var(--text-body);
}

.chat-setup .chat-setup-connect {
  height: 34px;
  padding: 0;
  border-radius: 8px;
  font-size: 13px;

  &:disabled {
    border-color: transparent;
    background: var(--field-surface);
    color: var(--text-muted);
    opacity: 1;
  }
}
</style>
