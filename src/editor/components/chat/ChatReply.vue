<template>
  <div class="chat-reply">
    <s-text v-if="turn.text || turn.stopped">
      <span class="chat-reply-body" v-text="turn.text" />
      <template v-if="turn.stopped">
        {{ turn.text ? '… ' : '' }}
        <span class="chat-reply-stopped">({{ t('stopped') }})</span>
      </template>
    </s-text>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SText } from '@stylebot/components';
import type { ChatAssistantTurn } from '@stylebot/types';

export default Vue.extend({
  name: 'ChatReply',

  components: {
    SText,
  },

  props: {
    turn: {
      type: Object as PropType<ChatAssistantTurn>,
      required: true,
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

.chat-reply-body {
  white-space: pre-wrap;
}

.chat-reply-stopped {
  color: var(--text-faint);
}
</style>
