<template>
  <span class="chat-attach-image">
    <s-icon-button
      :size="26"
      class="chat-attach-image-button"
      :title="t('attach_an_image_or_paste_a_screenshot')"
      :aria-label="t('attach_an_image')"
      @click="pick"
    >
      <image-icon :size="16" />
    </s-icon-button>
    <input
      ref="file"
      class="chat-attach-image-file"
      type="file"
      accept="image/*"
      tabindex="-1"
      aria-hidden="true"
      @change="onChange"
    />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import { SIconButton } from '@stylebot/components';
import { ImageIcon } from '@stylebot/icons';

/**
 * Attaches an image file picked from disk to the next message; emits
 * `change` once it's attached.
 */
export default Vue.extend({
  name: 'ChatAttachImageButton',

  components: {
    SIconButton,
    ImageIcon,
  },

  methods: {
    pick(): void {
      (this.$refs.file as HTMLInputElement).click();
    },

    async onChange(event: Event): Promise<void> {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      input.value = '';

      if (file) {
        await this.$store.dispatch('chat/attachImage', {
          file,
          name: file.name,
        });
        this.$emit('change');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-attach-image {
  display: flex;
  margin-left: -5px;
}

.chat-attach-image-button {
  border-radius: 7px;
  color: var(--text-secondary);

  &:hover {
    color: var(--text-primary);
  }
}

.chat-attach-image-file {
  display: none;
}
</style>
