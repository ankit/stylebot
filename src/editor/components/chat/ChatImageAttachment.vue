<template>
  <div class="chat-image-attachment">
    <img class="chat-image-attachment-thumb" :src="image.dataUrl" alt="" />
    <span class="chat-image-attachment-copy">
      <s-text as="span" class="chat-image-attachment-name">{{ name }}</s-text>
      <s-text as="span" size="small" variant="muted">
        {{ t('image_size_kb', [size]) }}
      </s-text>
    </span>
    <icon-button
      :size="22"
      class="chat-image-attachment-remove"
      :title="t('remove')"
      :aria-label="t('remove')"
      @click="$emit('remove')"
    >
      <icon-x :size="12" />
    </icon-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { IconButton, SText } from '@stylebot/components';
import { IconX } from '@stylebot/icons';
import type { ChatImage } from '@stylebot/types';

/**
 * The image going out with the next message, until it's sent or removed.
 */
export default Vue.extend({
  name: 'ChatImageAttachment',

  components: {
    IconButton,
    IconX,
    SText,
  },

  props: {
    image: {
      type: Object as PropType<ChatImage>,
      required: true,
    },
  },

  computed: {
    name(): string {
      return this.image.name || this.t('screenshot');
    },

    size(): string {
      return String(Math.max(1, Math.round(this.image.size / 1024)));
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-image-attachment {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 9px;
  box-sizing: border-box;
  max-width: min(100% - 4px, 280px);
  padding: 4px;
  border-radius: 9px;
  background: var(--active);
}

.chat-image-attachment-thumb {
  flex: none;
  width: 52px;
  height: 36px;
  box-sizing: border-box;
  border: 1px solid var(--field-border);
  border-radius: 6px;
  object-fit: cover;
  object-position: top left;
}

.chat-image-attachment-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 2px;
}

.chat-image-attachment .chat-image-attachment-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-image-attachment-remove {
  color: var(--icon-color);
}
</style>
