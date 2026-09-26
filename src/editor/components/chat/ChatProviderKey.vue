<template>
  <div class="chat-provider-key">
    <div class="chat-key-field">
      <s-text as="span" size="label">{{ t('provider') }}</s-text>
      <s-segmented-control
        :value="provider"
        :options="providerOptions"
        :disabled="connecting"
        @change="pickProvider"
      />
    </div>

    <div class="chat-key-field">
      <div class="chat-key-label-row">
        <s-text as="label" size="label" :for="inputId">{{ label }}</s-text>
        <s-text
          as="a"
          size="caption"
          variant="primary"
          class="chat-key-link"
          :href="info.keyUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('get_a_key_from', [info.company]) }}
        </s-text>
      </div>

      <div class="chat-key-box" :class="{ invalid: !!error }">
        <input
          :id="inputId"
          ref="input"
          class="chat-key-input"
          :value="value"
          :type="show ? 'text' : 'password'"
          :placeholder="
            info.keyPlaceholder
              ? t('paste_your_key', [info.keyPlaceholder])
              : t('paste_your_api_key')
          "
          :aria-invalid="error ? 'true' : 'false'"
          :aria-describedby="helpText ? `${inputId}-help` : undefined"
          spellcheck="false"
          autocomplete="off"
          @input="type"
        />
        <button
          type="button"
          class="chat-key-show"
          :aria-pressed="show ? 'true' : 'false'"
          @click="show = !show"
        >
          {{ show ? t('hide') : t('show') }}
        </button>
      </div>

      <s-text
        v-if="helpText"
        :id="`${inputId}-help`"
        size="caption"
        variant="muted"
        class="chat-key-help"
        :class="{ error: !!error }"
        :role="error ? 'alert' : undefined"
      >
        {{ helpText }}
      </s-text>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SSegmentedControl, SText } from '@stylebot/components';
import { chatProviders, getProviderInfo } from '@stylebot/chat';
import type { ChatProviderId, ChatProviderInfo } from '@stylebot/types';

import type { ChatError } from '../../store/chat';

/**
 * Picking a provider and pasting its key, with the reason in place of the
 * help line when the key is refused.
 */
export default Vue.extend({
  name: 'ChatProviderKey',

  components: {
    SSegmentedControl,
    SText,
  },

  props: {
    provider: {
      type: String as PropType<ChatProviderId>,
      required: true,
    },

    // The key typed so far.
    value: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      required: true,
    },

    // Shown under the field while there's no error.
    help: {
      type: String,
      default: '',
    },
  },

  data(): { show: boolean } {
    return {
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
        return this.help;
      }

      if (this.error.key === 'chat_error_wrong_provider_key') {
        return this.t(this.error.key, [this.info.keyPrefix ?? '']);
      }

      return this.t(this.error.key);
    },
  },

  mounted() {
    this.$store.dispatch('chat/clearConnectError');
    (this.$refs.input as HTMLInputElement).focus();
  },

  beforeDestroy() {
    this.$store.dispatch('chat/clearConnectError');
  },

  methods: {
    pickProvider(provider: ChatProviderId): void {
      this.$emit('update:provider', provider);
      this.clearError();
    },

    type(event: Event): void {
      this.$emit('input', (event.target as HTMLInputElement).value);
      this.clearError();
    },

    clearError(): void {
      if (this.error) {
        this.$store.dispatch('chat/clearConnectError');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-provider-key {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.chat-key-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-key-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.chat-key-link {
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring(2px);
}

.chat-key-box {
  display: flex;
  align-items: stretch;
  @include field-border(10px);
  overflow: hidden;
  background: var(--field-fill);

  &:hover {
    border-color: var(--field-border-hover);
  }

  &:focus-within {
    @include field-active-border;
  }

  &.invalid,
  &.invalid:focus-within {
    border-color: var(--danger);
    box-shadow: none;
  }
}

.chat-key-input {
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

.chat-key-show {
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

.chat-key-help {
  text-wrap: pretty;

  &.error {
    color: var(--danger);
  }
}
</style>
