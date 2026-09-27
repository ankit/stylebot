<template>
  <div
    :class="{ dropping }"
    @dragover.prevent="dropping = true"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
    @paste="onPaste"
  >
    <chat-image-attachment v-if="image" :image="image" @remove="remove" />
    <s-text v-if="imageError" size="caption" class="chat-image-error">
      {{ t('couldnt_read_that_image') }}
    </s-text>

    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SText } from '@stylebot/components';
import type { ChatImage } from '@stylebot/types';

import ChatImageAttachment from './ChatImageAttachment.vue';
import { getImageFile } from '../../utils/chat-image';

/**
 * Takes an image dropped or pasted onto its contents as the next message's
 * attachment, and shows it above them. Emits `change` when the attachment
 * does.
 */
export default Vue.extend({
  name: 'ChatImageDropZone',

  components: {
    ChatImageAttachment,
    SText,
  },

  data(): { dropping: boolean } {
    return {
      dropping: false,
    };
  },

  computed: {
    image(): ChatImage | null {
      return this.$store.state.chat.draftImage;
    },

    imageError(): boolean {
      return this.$store.state.chat.imageError;
    },
  },

  methods: {
    async attach(file: File): Promise<void> {
      await this.$store.dispatch('chat/attachImage', {
        file,
        name: file.name,
      });
      this.$emit('change');
    },

    remove(): void {
      this.$store.dispatch('chat/removeImage');
      this.$emit('change');
    },

    /**
     * Takes a pasted image (a screenshot on the clipboard); pasted text is
     * left to the field.
     */
    onPaste(event: ClipboardEvent): void {
      const file = getImageFile(event.clipboardData);

      if (file) {
        event.preventDefault();
        this.$store.dispatch('chat/attachImage', { file });
      }
    },

    // Leaving for one of its own children isn't leaving the zone.
    onDragLeave(event: DragEvent): void {
      const zone = event.currentTarget as HTMLElement;

      if (!zone.contains(event.relatedTarget as Node | null)) {
        this.dropping = false;
      }
    },

    onDrop(event: DragEvent): void {
      this.dropping = false;
      const file = getImageFile(event.dataTransfer);

      if (file) {
        this.attach(file);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-image-error {
  color: var(--danger);
}
</style>
