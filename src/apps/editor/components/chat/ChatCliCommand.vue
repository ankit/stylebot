<template>
  <div class="chat-cli-command" :class="{ prose: !shell }">
    <s-text as="code" class="chat-cli-command-text">
      <span v-if="shell" class="chat-cli-command-prompt" aria-hidden="true">
        $
      </span>
      {{ command }}
    </s-text>
    <s-copy-button ref="copyButton" :text="command" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SCopyButton, SText } from '@stylebot/components';

/**
 * A shell command to paste in a terminal, with a button that copies it, or
 * without the shell prompt, a request to paste to a coding agent.
 */
export default Vue.extend({
  name: 'ChatCliCommand',

  components: {
    SCopyButton,
    SText,
  },

  props: {
    command: {
      type: String,
      required: true,
    },

    shell: {
      type: Boolean,
      default: true,
    },
  },

  methods: {
    copy(): Promise<void> {
      return (this.$refs.copyButton as InstanceType<typeof SCopyButton>).copy();
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-cli-command {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 3px 3px 10px;
  border: 1px solid var(--setup-field-border, var(--panel-border));
  border-radius: 8px;
  background: var(--setup-field-surface, var(--card-surface));

  &.prose {
    align-items: flex-start;
    background: var(--field-surface);
  }
}

.chat-cli-command-text {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  overflow-wrap: anywhere;

  .prose & {
    padding: 4px 0;
  }
}

.chat-cli-command-prompt {
  margin-right: 1ch;
  color: var(--text-faint);
  user-select: none;
}
</style>
