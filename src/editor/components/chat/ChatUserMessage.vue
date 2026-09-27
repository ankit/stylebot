<template>
  <div class="chat-user-message">
    <s-text
      v-if="turn.scope"
      as="span"
      size="small"
      variant="primary"
      class="chat-user-scope"
      :title="turn.scope"
    >
      <cursor-icon :size="11" class="chat-user-scope-icon" />
      <span class="chat-user-scope-selector">{{ turn.scope }}</span>
    </s-text>
    <img
      v-if="turn.image"
      class="chat-user-image"
      :src="turn.image.dataUrl"
      :alt="turn.image.name || t('screenshot')"
    />
    <s-text class="chat-user-text">
      <span class="chat-user-body" v-text="turn.text" />
    </s-text>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SText } from '@stylebot/components';
import { CursorIcon } from '@stylebot/icons';
import type { ChatUserTurn } from '@stylebot/types';

export default Vue.extend({
  name: 'ChatUserMessage',

  components: {
    CursorIcon,
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

.chat-user-message .chat-user-scope {
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
}

.chat-user-scope-icon {
  flex: none;
}

.chat-user-scope-selector {
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-user-image {
  width: 120px;
  height: 80px;
  box-sizing: border-box;
  border: 1px solid var(--field-border);
  border-radius: 6px;
  object-fit: cover;
  object-position: top left;
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
