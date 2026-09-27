<template>
  <div class="chat-reply">
    <s-text v-if="turn.text || turn.stopped" class="chat-reply-text">
      <span class="chat-reply-body" v-text="turn.text" />
      <template v-if="turn.stopped">
        {{ turn.text ? '… ' : '' }}
        <span class="chat-reply-stopped">({{ t('stopped') }})</span>
      </template>
    </s-text>

    <chat-change-card
      v-if="turn.edits.length"
      :turn="turn"
      :latest="latest"
      :busy="busy"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SText } from '@stylebot/components';
import type { ChatAssistantTurn } from '@stylebot/types';

import ChatChangeCard from './ChatChangeCard.vue';

export default Vue.extend({
  name: 'ChatReply',

  components: {
    ChatChangeCard,
    SText,
  },

  props: {
    turn: {
      type: Object as PropType<ChatAssistantTurn>,
      required: true,
    },

    latest: {
      type: Boolean,
      default: false,
    },

    busy: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-reply {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-reply .chat-reply-text {
  font-family: var(--font-reading);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.55;

  @include dark-mode {
    color: #c3c7ce;
  }

  .chat-reply-body,
  .chat-reply-stopped {
    font-family: inherit;
  }
}

.chat-reply-body {
  white-space: pre-wrap;
}

.chat-reply-stopped {
  color: var(--text-faint);
}
</style>
