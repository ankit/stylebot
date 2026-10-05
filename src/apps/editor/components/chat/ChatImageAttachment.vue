<template>
  <s-attachment
    class="chat-image-attachment"
    :remove-label="t('remove')"
    @remove="$emit('remove')"
  >
    <template #media>
      <img class="chat-image-attachment-thumb" :src="image.dataUrl" alt="" />
    </template>
    {{ name }}
    <template #meta>{{ t('image_size_kb', [size]) }}</template>
  </s-attachment>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SAttachment } from '@stylebot/components';
import type { ChatImage } from '@stylebot/types';

/**
 * The image going out with the next message, until it's sent or removed.
 */
export default Vue.extend({
  name: 'ChatImageAttachment',

  components: {
    SAttachment,
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
  flex-shrink: 3;
}

.chat-image-attachment-thumb {
  width: 36px;
  height: 100%;
  object-fit: cover;
  object-position: top left;
}
</style>
