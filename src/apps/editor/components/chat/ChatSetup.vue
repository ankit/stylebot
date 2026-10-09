<template>
  <form class="chat-setup" @submit.prevent="connect">
    <s-heading as="h2" size="lg">{{ t('bring_your_own_ai') }}</s-heading>

    <div class="chat-setup-options" role="radiogroup">
      <div
        v-if="cli"
        class="chat-setup-option"
        :class="{ picked: choice === 'terminal' }"
      >
        <button
          type="button"
          role="radio"
          class="chat-setup-option-pick"
          :aria-checked="choice === 'terminal' ? 'true' : 'false'"
          @click="pickTerminal"
        >
          <span class="chat-setup-option-title">
            <s-heading as="span" size="md">
              {{ t('from_your_terminal') }}
            </s-heading>
            <s-text
              as="span"
              size="caption"
              variant="muted"
              class="chat-setup-option-note"
            >
              {{ t('no_api_key_needed') }}
            </s-text>
          </span>
          <s-text
            as="span"
            variant="muted"
            class="chat-setup-option-description"
          >
            {{ t('from_your_terminal_description') }}
          </s-text>
        </button>

        <chat-cli-steps v-if="choice === 'terminal'" />
      </div>

      <div class="chat-setup-option" :class="{ picked: choice === 'chat' }">
        <button
          type="button"
          role="radio"
          class="chat-setup-option-pick"
          :aria-checked="choice === 'chat' ? 'true' : 'false'"
          @click="choice = 'chat'"
        >
          <s-heading as="span" size="md">{{ t('here_in_chat') }}</s-heading>
          <s-text
            as="span"
            variant="muted"
            class="chat-setup-option-description"
          >
            {{ t('here_in_chat_description') }}
          </s-text>
        </button>

        <div v-if="choice === 'chat'" class="chat-setup-key">
          <s-segmented-control
            :value="provider"
            :options="providerOptions"
            :disabled="connecting"
            @change="pickProvider"
          />

          <chat-key-input
            v-model="key"
            :provider="provider"
            :label="t('api_key')"
            :help="t('api_key_saved_locally', [info.company])"
          />
        </div>
      </div>
    </div>

    <div class="chat-setup-footer">
      <s-text
        v-if="choice === 'terminal'"
        as="a"
        size="label"
        variant="muted"
        class="chat-setup-cli-guide"
        href="https://stylebot.dev/cli"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t('see_cli_guide') }}
        <arrow-up-right-icon :size="14" />
      </s-text>

      <s-button
        v-else
        class="chat-setup-connect"
        variant="primary"
        :disabled="!key.trim() || connecting"
        @click="connect"
      >
        {{
          connecting ? t('checking_key') : t('connect_provider', [info.name])
        }}
      </s-button>
    </div>
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
import { ArrowUpRightIcon } from '@stylebot/icons';
import { chatProviders, getProviderInfo } from '@stylebot/chat';
import { supportsCLI } from '@stylebot/settings';
import type { ChatProviderId, ChatProviderInfo } from '@stylebot/types';

import ChatCliSteps from './ChatCliSteps.vue';
import ChatKeyInput from './ChatKeyInput.vue';

type Choice = 'terminal' | 'chat';

export default Vue.extend({
  name: 'ChatSetup',

  components: {
    ArrowUpRightIcon,
    ChatCliSteps,
    ChatKeyInput,
    SHeading,
    SButton,
    SSegmentedControl,
    SText,
  },

  props: {
    // With the CLI already connected, picking the terminal leaves setup.
    cliConnected: Boolean,
  },

  data(): { choice: Choice; provider: ChatProviderId; key: string } {
    return {
      choice: supportsCLI() && !this.cliConnected ? 'terminal' : 'chat',
      provider: this.$store.state.chat.status?.provider ?? 'anthropic',
      key: '',
    };
  },

  computed: {
    cli(): boolean {
      return supportsCLI();
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
  },

  methods: {
    pickTerminal(): void {
      if (this.cliConnected) {
        this.$emit('terminal');
        return;
      }

      this.choice = 'terminal';
    },

    pickProvider(provider: ChatProviderId): void {
      this.provider = provider;
      this.$store.dispatch('chat/clearConnectError');
    },

    connect(): void {
      if (this.choice !== 'chat' || !this.key.trim()) {
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
  --setup-picked-surface: var(--chat-surface);
  --setup-field-surface: var(--card-surface);
  --setup-field-border: var(--panel-border);
  --setup-inset-surface: var(--field-surface-hover);

  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1 0 auto;
  padding: 20px var(--panel-gutter) 16px;
  box-sizing: border-box;

  @include dark-mode {
    --setup-picked-surface: var(--field-surface);
    --setup-field-surface: var(--field-surface);
    --setup-field-border: var(--field-border);
    --setup-inset-surface: var(--field-fill);
  }
}

.chat-setup-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-setup-option {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--panel-border);
  border-radius: 12px;

  &:not(.picked):hover {
    border-color: var(--field-border);
    background: var(--hover-tint);
  }

  &.picked {
    gap: 14px;
    padding-bottom: 14px;
    border-color: var(--field-border-hover);
    box-shadow: inset 0 0 0 0.5px var(--field-border-hover);
    background: var(--setup-picked-surface);
  }
}

.chat-setup-option-pick {
  @include button-reset;

  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 14px;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;

  .picked & {
    padding-bottom: 0;
    cursor: default;
  }

  @include focus-ring;
}

.chat-setup-option-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.chat-setup-option-note {
  flex: none;
}

.chat-setup-option-description {
  text-wrap: pretty;
}

.chat-setup-option > :not(.chat-setup-option-pick) {
  margin: 0 14px;
}

.chat-setup-key {
  --field-surface: var(--setup-inset-surface);

  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-setup-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.chat-setup-cli-guide {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  align-self: center;
  border-radius: 4px;
  text-decoration: none;

  @include focus-ring(2px);
}

.chat-setup .chat-setup-cli-guide:hover {
  color: var(--text-primary);
}

.chat-setup .chat-setup-connect {
  height: 38px;
  padding: 0;
  border-radius: 10px;
  font-size: 14px;

  &:disabled {
    border-color: transparent;
    background: var(--field-surface);
    color: var(--text-muted);
    opacity: 1;
  }
}
</style>
