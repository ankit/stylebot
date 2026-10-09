<template>
  <div class="chat-terminal">
    <div class="chat-terminal-intro">
      <s-heading as="h2" size="lg" class="chat-terminal-heading">
        <span class="chat-terminal-dot" aria-hidden="true" />
        {{ t('connected_to_your_terminal') }}
      </s-heading>
      <s-text variant="muted" class="chat-terminal-description">
        {{ t('connected_to_your_terminal_description') }}
      </s-text>
    </div>

    <div class="chat-terminal-looks">
      <chat-suggestions
        pickable
        :picked="picked ? picked.id : ''"
        @pick="pick"
      />

      <chat-cli-command
        v-if="picked"
        ref="prompt"
        :command="prompt"
        :shell="false"
      />
    </div>

    <button type="button" class="chat-terminal-chat" @click="$emit('chat')">
      <span class="chat-terminal-chat-text">
        <s-heading as="span" size="md">
          {{ t('here_in_chat') }}
        </s-heading>
        <s-text
          as="span"
          variant="muted"
          class="chat-terminal-chat-description"
        >
          {{ t('here_in_chat_description') }}
        </s-text>
      </span>
      <chevron-right-icon :size="16" class="chat-terminal-chat-chevron" />
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import type { ChatSuggestion } from '@stylebot/chat';
import { SHeading, SText } from '@stylebot/components';
import { ChevronRightIcon } from '@stylebot/icons';

import ChatCliCommand from './ChatCliCommand.vue';
import ChatSuggestions from './ChatSuggestions.vue';

/**
 * What the Chat tab shows while a coding agent is connected through the CLI
 * and no key is: looks to turn into a prompt for the terminal, and the way
 * to set up Chat here too.
 */
export default Vue.extend({
  name: 'ChatTerminal',

  components: {
    ChatCliCommand,
    ChatSuggestions,
    ChevronRightIcon,
    SHeading,
    SText,
  },

  data(): { picked: ChatSuggestion | null } {
    return {
      picked: null,
    };
  },

  computed: {
    prompt(): string {
      if (!this.picked) {
        return '';
      }

      return `Style ${this.$store.state.url} using Stylebot with this theme: ${this.picked.request}`;
    },
  },

  methods: {
    async pick(item: ChatSuggestion | null): Promise<void> {
      this.picked = item;

      if (item) {
        await this.$nextTick();
        (this.$refs.prompt as InstanceType<typeof ChatCliCommand>).copy();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-terminal {
  display: flex;
  flex-direction: column;
  gap: 22px;
  flex: 1 0 auto;
  padding: 20px var(--panel-gutter) 16px;
  box-sizing: border-box;
}

.chat-terminal-intro {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-terminal-heading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-terminal-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 3px var(--success-background);
}

.chat-terminal-description {
  text-wrap: pretty;
}

.chat-terminal-looks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chat-terminal-chat {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding: 12px 14px;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: var(--field-border);
    background: var(--hover-tint);
  }

  @include focus-ring;
}

.chat-terminal-chat-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chat-terminal-chat-description {
  text-wrap: pretty;
}

.chat-terminal-chat-chevron {
  flex: none;
  color: var(--text-faint);
}
</style>
