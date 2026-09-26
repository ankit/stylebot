<template>
  <form class="chat-setup" @submit.prevent="connect">
    <div class="chat-setup-intro">
      <heading as="h2" size="md">{{ t('connect_a_model_to_start') }}</heading>
      <s-text variant="muted">{{ t('chat_setup_description') }}</s-text>
    </div>

    <div class="chat-setup-field">
      <s-text as="span" size="label">{{ t('provider') }}</s-text>
      <s-segmented-control
        :value="provider"
        :options="providerOptions"
        :disabled="connecting"
        @change="pickProvider"
      />
    </div>

    <div class="chat-setup-field">
      <div class="chat-setup-label-row">
        <s-text as="label" size="label" :for="inputId">
          {{ t('api_key') }}
        </s-text>
        <s-text
          as="a"
          size="caption"
          variant="primary"
          class="chat-setup-link"
          :href="info.keyUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('get_a_key_from', [info.company]) }}
        </s-text>
      </div>

      <div class="chat-setup-key" :class="{ invalid: !!error }">
        <input
          :id="inputId"
          ref="input"
          v-model="key"
          class="chat-setup-input"
          :type="show ? 'text' : 'password'"
          :placeholder="
            info.keyPlaceholder
              ? t('paste_your_key', [info.keyPlaceholder])
              : t('paste_your_api_key')
          "
          :aria-invalid="error ? 'true' : 'false'"
          :aria-describedby="`${inputId}-help`"
          spellcheck="false"
          autocomplete="off"
          @input="clearError"
        />
        <button
          type="button"
          class="chat-setup-show"
          :aria-pressed="show ? 'true' : 'false'"
          @click="show = !show"
        >
          {{ show ? t('hide') : t('show') }}
        </button>
      </div>

      <s-text
        :id="`${inputId}-help`"
        size="caption"
        variant="muted"
        class="chat-setup-help"
        :class="{ error: !!error }"
        :role="error ? 'alert' : undefined"
      >
        {{ helpText }}
      </s-text>
    </div>

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

import {
  Heading,
  SButton,
  SSegmentedControl,
  SText,
} from '@stylebot/components';
import { chatProviders, getProviderInfo } from '@stylebot/chat';
import type { ChatProviderId, ChatProviderInfo } from '@stylebot/types';

import type { ChatError } from '../../store/chat';

export default Vue.extend({
  name: 'ChatSetup',

  components: {
    Heading,
    SButton,
    SSegmentedControl,
    SText,
  },

  data(): { provider: ChatProviderId; key: string; show: boolean } {
    return {
      provider: this.$store.state.chat.status?.provider ?? 'anthropic',
      key: '',
      show: false,
    };
  },

  computed: {
    inputId(): string {
      return 'stylebot-chat-api-key';
    },

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

    error(): ChatError | null {
      return this.$store.state.chat.connectError;
    },

    helpText(): string {
      if (!this.error) {
        return this.t('api_key_saved_locally', [this.info.company]);
      }

      if (this.error.key === 'chat_error_wrong_provider_key') {
        return this.t(this.error.key, [this.info.keyPrefix ?? '']);
      }

      return this.t(this.error.key);
    },
  },

  mounted() {
    (this.$refs.input as HTMLInputElement).focus();
  },

  methods: {
    pickProvider(provider: ChatProviderId): void {
      this.provider = provider;
      this.clearError();
    },

    clearError(): void {
      if (this.error) {
        this.$store.dispatch('chat/clearConnectError');
      }
    },

    connect(): void {
      if (!this.key.trim() || this.connecting) {
        return;
      }

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

.chat-setup-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-setup-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.chat-setup-link {
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring(2px);
}

.chat-setup-key {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--field-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--field-fill);

  &:hover {
    border-color: var(--field-border-hover);
  }

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }

  &.invalid,
  &.invalid:focus-within {
    border-color: var(--danger);
    box-shadow: none;
  }
}

.chat-setup-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  height: 38px;
  padding: 0 12px;
  border: 0;
  outline: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: normal;
  color: var(--text-primary);
  background: transparent;

  &::placeholder {
    color: var(--text-faint);
  }
}

.chat-setup-show {
  @include button-reset;
  flex: none;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-left: 1px solid var(--field-divider);
  font-weight: 500;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--hover-tint);
    color: var(--text-primary);
  }

  @include focus-ring;
}

.chat-setup-help {
  text-wrap: pretty;

  &.error {
    color: var(--danger);
  }
}

.chat-setup-spacer {
  flex: 1;
}

.chat-setup-connect {
  padding: 10px 0;
  border-radius: 10px;
}
</style>
