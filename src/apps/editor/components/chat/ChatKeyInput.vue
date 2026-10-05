<template>
  <div class="chat-key-input">
    <div class="chat-key-label-row">
      <s-text as="label" class="chat-key-label" :for="inputId">
        {{ label }}
      </s-text>
      <s-text
        as="a"
        size="caption"
        variant="primary"
        class="chat-key-link"
        :href="info.keyUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t('get_a_key') }}
      </s-text>
    </div>

    <div class="chat-key-box" :class="{ invalid: !!error }">
      <input
        :id="inputId"
        ref="input"
        class="chat-key-input-field"
        :class="{ masked: !show }"
        :value="value"
        type="text"
        :placeholder="info.keyPlaceholder || t('paste_your_api_key')"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="helpText ? `${inputId}-help` : undefined"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        data-1p-ignore
        data-bwignore
        data-lpignore="true"
        data-form-type="other"
        @input="type"
      />
      <button
        type="button"
        class="chat-key-show"
        :aria-label="show ? t('hide') : t('show')"
        :aria-pressed="show ? 'true' : 'false'"
        @click="show = !show"
      >
        <eye-off-icon v-if="show" :size="14" />
        <eye-icon v-else :size="14" />
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
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SText } from '@stylebot/components';
import { EyeIcon, EyeOffIcon } from '@stylebot/icons';
import { getProviderInfo } from '@stylebot/chat';
import type { ChatProviderId, ChatProviderInfo } from '@stylebot/types';

import type { ChatError } from '../../store/chat';

/**
 * A field for pasting a provider's key, with where to get one, and the
 * reason in place of the help line when the key is refused.
 */
export default Vue.extend({
  name: 'ChatKeyInput',

  components: {
    EyeIcon,
    EyeOffIcon,
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
.chat-key-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-key-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.chat-key-label {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-body);
}

.chat-key-link {
  font-size: 13px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring(2px);
}

.chat-key-box {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 4px 0 12px;
  border-radius: 8px;
  background: var(--field-surface);

  &:focus-within {
    box-shadow: 0 0 0 2px var(--accent);
  }

  &.invalid,
  &.invalid:focus-within {
    box-shadow: 0 0 0 1px var(--danger);
  }
}

.chat-key-input-field {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--field-ink);
  background: transparent;

  &.masked {
    -webkit-text-security: disc;
  }

  &::placeholder {
    color: var(--field-placeholder);
  }
}

.chat-key-show {
  @include button-reset;

  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    background: var(--field-surface-hover);
    color: var(--text-primary);
  }

  @include focus-ring;
}

.chat-key-help {
  font-size: 12px;
  text-wrap: pretty;

  &.error {
    color: var(--danger);
  }
}
</style>
