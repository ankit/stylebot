<template>
  <div class="chat-user-message">
    <s-text class="chat-user-text">
      <span class="chat-user-body" v-text="turn.text" />
    </s-text>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SText } from '@stylebot/components';
import type { ChatUserTurn } from '@stylebot/types';

export default Vue.extend({
  name: 'ChatUserMessage',

  components: {
    SText,
  },

  props: {
    turn: {
      type: Object as PropType<ChatUserTurn>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-user-message {
  align-self: flex-end;
  max-width: 84%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.chat-user-text {
  padding: 9px 12px;
  border-radius: 12px 12px 4px 12px;
  background: var(--active);
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.chat-user-body {
  white-space: pre-wrap;
}
</style>
