<template>
  <div class="chat-reply">
    <chat-markdown v-if="turn.text || turn.stopped" :text="turn.text">
      <template v-if="turn.stopped">
        {{ turn.text ? '… ' : '' }}
        <span class="chat-reply-stopped">({{ t('stopped') }})</span>
      </template>
    </chat-markdown>

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

import type { ChatAssistantTurn } from '@stylebot/types';

import ChatChangeCard from './ChatChangeCard.vue';
import ChatMarkdown from './ChatMarkdown.vue';

export default Vue.extend({
  name: 'ChatReply',

  components: {
    ChatChangeCard,
    ChatMarkdown,
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
  gap: 12px;
}

.chat-reply-stopped {
  font-family: inherit;
  color: var(--text-faint);
}
</style>
