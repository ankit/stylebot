<template>
  <div class="chat-provider-card">
    <div class="chat-provider-card-row">
      <div class="chat-provider-card-copy">
        <s-heading as="h3" size="sm" class="chat-provider-card-name">
          <span
            class="chat-provider-card-dot"
            :class="{ connected: provider.connected }"
          />
          {{ info.name }}
        </s-heading>
        <s-text
          as="span"
          size="caption"
          variant="muted"
          class="chat-provider-card-key"
          :class="{ masked: provider.connected }"
        >
          {{ provider.connected ? provider.maskedKey : t('not_connected') }}
        </s-text>
      </div>

      <div v-if="provider.connected" class="chat-provider-card-actions">
        <s-text
          as="a"
          size="caption"
          variant="primary"
          class="chat-provider-card-usage"
          :href="info.usageUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('usage') }}
        </s-text>
        <s-text
          as="button"
          type="button"
          size="caption"
          class="chat-provider-card-remove"
          @click.native="remove"
        >
          {{ t('remove') }}
        </s-text>
      </div>
      <s-button v-else-if="!editing" size="small" @click="$emit('add')">
        {{ t('add_key') }}
      </s-button>
    </div>

    <form
      v-if="editing"
      class="chat-provider-card-form"
      @submit.prevent="connect"
    >
      <chat-key-input
        v-model="key"
        :provider="provider.id"
        :label="t('api_key')"
      />
      <div class="chat-provider-card-buttons">
        <s-button
          class="chat-provider-card-connect"
          variant="primary"
          :disabled="!key.trim() || connecting"
          @click="connect"
        >
          {{ connecting ? t('checking_key') : t('connect') }}
        </s-button>
        <s-button @click="$emit('cancel')">{{ t('cancel') }}</s-button>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SHeading, SButton, SText } from '@stylebot/components';
import { getProviderInfo } from '@stylebot/chat';
import type { ChatProviderInfo, ChatProviderStatus } from '@stylebot/types';

import ChatKeyInput from './ChatKeyInput.vue';

/**
 * One provider on the Providers screen: its key with Usage and Remove once
 * connected, or Add key, which opens a key field in place.
 */
export default Vue.extend({
  name: 'ChatProviderCard',

  components: {
    ChatKeyInput,
    SHeading,
    SButton,
    SText,
  },

  props: {
    provider: {
      type: Object as PropType<ChatProviderStatus>,
      required: true,
    },

    // Showing the key field.
    editing: {
      type: Boolean,
      default: false,
    },
  },

  data(): { key: string } {
    return {
      key: '',
    };
  },

  computed: {
    info(): ChatProviderInfo {
      return getProviderInfo(this.provider.id);
    },

    connecting(): boolean {
      return this.$store.state.chat.connecting;
    },
  },

  methods: {
    async connect(): Promise<void> {
      const connected = await this.$store.dispatch('chat/connect', {
        provider: this.provider.id,
        key: this.key,
      });

      if (connected) {
        this.key = '';
        this.$emit('cancel');
      }
    },

    remove(): void {
      this.$store.dispatch('chat/removeKey', this.provider.id);
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-provider-card {
  flex: none;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  background: var(--card-surface);
  overflow: hidden;
}

.chat-provider-card-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.chat-provider-card-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-provider-card .chat-provider-card-name {
  display: flex;
  align-items: center;
  gap: 7px;
}

.chat-provider-card-dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-faint);

  &.connected {
    background: var(--success);
  }
}

.chat-provider-card-key {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.masked {
    font-family: var(--font-mono);
  }
}

.chat-provider-card-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 14px;
}

.chat-provider-card-actions .chat-provider-card-usage {
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring(2px);
}

.chat-provider-card-actions .chat-provider-card-remove {
  padding: 0;
  font-weight: 500;
  border: 0;
  background: none;
  font-family: inherit;
  color: var(--danger);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring(2px);
}

.chat-provider-card-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px 14px;
  border-top: 1px solid var(--panel-border);
  background: var(--tab-surface);
}

.chat-provider-card-buttons {
  display: flex;
  gap: 8px;
}

.chat-provider-card-connect {
  flex: 1;
}
</style>
