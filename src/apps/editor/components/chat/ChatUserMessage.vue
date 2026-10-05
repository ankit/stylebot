<template>
  <div class="chat-user-message">
    <s-attachment v-if="turn.scope" mono size="small" class="chat-user-scope">
      <template #media><inspector-icon :size="11" /></template>
      {{ turn.scope }}
    </s-attachment>
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

import { SAttachment, SText } from '@stylebot/components';
import { InspectorIcon } from '@stylebot/icons';
import type { ChatUserTurn } from '@stylebot/types';

export default Vue.extend({
  name: 'ChatUserMessage',

  components: {
    InspectorIcon,
    SAttachment,
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
  max-width: 76%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.chat-user-image {
  width: 140px;
  height: 84px;
  box-sizing: border-box;
  border: 1px solid var(--field-border);
  border-radius: 8px;
  object-fit: cover;
  object-position: top left;
}

.chat-user-message .chat-user-text {
  padding: 9px 13px;
  font-size: 14px;
  border: 1px solid
    color-mix(in srgb, var(--text-primary) 9%, var(--tab-surface));
  border-radius: 14px;
  background: color-mix(in srgb, var(--text-primary) 6%, var(--tab-surface));
  color: var(--text-primary);
  line-height: 1.45;
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.chat-user-body {
  white-space: pre-wrap;
}
</style>
