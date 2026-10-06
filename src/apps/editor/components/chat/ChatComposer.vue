<template>
  <div class="chat-composer">
    <chat-image-drop-zone class="chat-composer-box" @change="focus">
      <div v-if="selector || image" class="chat-composer-context">
        <chat-picked-element v-if="selector" @remove="focus" />
        <chat-image-attachment
          v-if="image"
          :image="image"
          @remove="removeImage"
        />
      </div>

      <chat-input
        ref="input"
        v-model="draft"
        @submit="send"
        @remove-last="removeLast"
      />

      <div class="chat-composer-footer">
        <chat-attach-image-button @change="focus" />
        <chat-model-menu @providers="$emit('providers')" />
        <span class="chat-composer-spacer" />
        <chat-usage />
        <chat-send-button
          :pending="pending"
          :disabled="!canSend"
          @send="send"
          @stop="stop"
        />
      </div>
    </chat-image-drop-zone>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import type { ChatImage } from '@stylebot/types';

import ChatAttachImageButton from './ChatAttachImageButton.vue';
import ChatImageAttachment from './ChatImageAttachment.vue';
import ChatImageDropZone from './ChatImageDropZone.vue';
import ChatInput from './ChatInput.vue';
import ChatModelMenu from './ChatModelMenu.vue';
import ChatPickedElement from './ChatPickedElement.vue';
import ChatUsage from './ChatUsage.vue';
import ChatSendButton from './ChatSendButton.vue';

export default Vue.extend({
  name: 'ChatComposer',

  components: {
    ChatAttachImageButton,
    ChatImageAttachment,
    ChatImageDropZone,
    ChatInput,
    ChatModelMenu,
    ChatPickedElement,
    ChatUsage,
    ChatSendButton,
  },

  data(): { draft: string } {
    return {
      draft: '',
    };
  },

  computed: {
    selector(): string {
      return this.$store.state.activeSelector;
    },

    image(): ChatImage | null {
      return this.$store.state.chat.draftImage;
    },

    inspecting(): boolean {
      return this.$store.state.inspecting;
    },

    pending(): boolean {
      return !!this.$store.state.chat.pending;
    },

    canSend(): boolean {
      return !!this.draft.trim() && !this.pending;
    },
  },

  watch: {
    // Back to the field once a pick lands.
    inspecting(value: boolean): void {
      if (!value && this.selector) {
        this.focus();
      }
    },
  },

  methods: {
    focus(): void {
      (this.$refs.input as InstanceType<typeof ChatInput>).focus();
    },

    removeImage(): void {
      this.$store.dispatch('chat/removeImage');
      this.focus();
    },

    /**
     * Backspace in the empty field takes off the last item above it: the
     * image first, since it was added for this message, then the picked
     * element.
     */
    removeLast(): void {
      if (this.image) {
        this.$store.dispatch('chat/removeImage');
      } else if (this.selector) {
        this.$store.commit('setActiveSelector', '');
      }
    },

    /**
     * Puts text in the message field to edit before sending.
     */
    fill(text: string): void {
      this.draft = text;
      this.focus();
    },

    stop(): void {
      this.$store.dispatch('chat/stop');
    },

    send(): void {
      if (!this.canSend) {
        return;
      }

      this.$store.dispatch('chat/sendDraft', this.draft);
      this.draft = '';
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-composer {
  position: relative;
  z-index: 3;
  flex: none;
  padding: 0 var(--panel-gutter) 12px;
}

.chat-composer-box {
  @include field-border(12px);

  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 8px 12px;
  background: var(--panel-surface);
  box-shadow: 0 1px 2px rgb(20 30 50 / 4%);
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover,
  &:focus-within {
    border-color: var(--field-border-hover);
  }

  &.dropping {
    border-color: color-mix(in srgb, var(--accent) 60%, var(--card-surface));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @include dark-mode {
    &:hover,
    &:focus-within,
    &.dropping {
      border-color: var(--field-border);
    }
  }
}

.chat-composer-context {
  display: flex;
  gap: 6px;
  min-width: 0;
}

.chat-composer-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-composer-spacer {
  flex: 1;
}
</style>
