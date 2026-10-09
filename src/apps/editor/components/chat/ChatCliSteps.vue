<template>
  <ol class="chat-cli-steps">
    <li class="chat-cli-step">
      <s-text as="span" size="label" class="chat-cli-step-label">
        {{ t('install_the_cli') }}
      </s-text>
      <chat-cli-command command="npm install -g @stylebot/cli" />
    </li>

    <li class="chat-cli-step">
      <s-text as="span" size="label" class="chat-cli-step-label">
        {{ t('connect_it_to_your_browsers') }}
      </s-text>
      <chat-cli-command command="stylebot install" />
    </li>

    <li class="chat-cli-step">
      <s-text as="span" size="label" class="chat-cli-step-label">
        {{ t('turn_on_command_line_access') }}
      </s-text>
      <s-link-button class="chat-cli-access" @click="openOptions">
        {{ t('let_apps_on_this_computer_control_stylebot') }}
        <arrow-up-right-icon :size="14" />
      </s-link-button>
    </li>
  </ol>
</template>

<script lang="ts">
import Vue from 'vue';

import { SLinkButton, SText } from '@stylebot/components';
import { ArrowUpRightIcon } from '@stylebot/icons';
import { openOptionsPage } from '@stylebot/utils';

import ChatCliCommand from './ChatCliCommand.vue';

/**
 * The CLI's setup steps, matching stylebot.dev/cli. The last one opens the
 * setting in Options, which turns it on there.
 */
export default Vue.extend({
  name: 'ChatCliSteps',

  components: {
    ArrowUpRightIcon,
    ChatCliCommand,
    SLinkButton,
    SText,
  },

  methods: {
    openOptions(): void {
      openOptionsPage('/basics');
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-cli-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: chat-cli-step;
}

.chat-cli-step {
  display: flex;
  flex-direction: column;
  gap: 6px;
  counter-increment: chat-cli-step;
}

.chat-cli-step-label::before {
  content: counter(chat-cli-step) '. ';
}

.chat-cli-step .chat-cli-access {
  display: flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  white-space: normal;
  text-align: left;
}
</style>
