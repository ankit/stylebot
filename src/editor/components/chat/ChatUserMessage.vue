<template>
  <div class="chat-user-message">
    <span v-if="turn.scope" class="chat-user-scope" :title="turn.scope">
      {{ turn.scope }}
    </span>
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

.chat-user-scope {
  max-width: 100%;
  box-sizing: border-box;
  padding: 0 2px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.3;
  color: var(--text-faint);
  @include truncate;

  @include dark-mode {
    color: #80858e;
  }
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

.chat-user-message .chat-user-text {
  padding: 7px 11px;
  font-size: 14px;
  border: 1px solid
    color-mix(in srgb, var(--text-primary) 9%, var(--tab-surface));
  border-radius: 16px;
  background: color-mix(in srgb, var(--text-primary) 6%, var(--tab-surface));
  color: var(--text-primary);
  line-height: 1.5;
  text-wrap: pretty;
  overflow-wrap: anywhere;

  @include dark-mode {
    border-color: #313338;
    background: #27292d;
    color: #c3c7ce;
  }
}

.chat-user-body {
  white-space: pre-wrap;
}
</style>
