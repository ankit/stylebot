<template>
  <div class="chat-composer">
    <chat-image-drop-zone class="chat-composer-box" @change="focus">
      <chat-input ref="input" v-model="draft" @submit="send" />

      <div class="chat-composer-footer">
        <chat-attach-image-button @change="focus" />
        <chat-model-menu
          @new-chat="$emit('new-chat')"
          @providers="$emit('providers')"
        />
        <span class="chat-composer-spacer" />
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

import ChatAttachImageButton from './ChatAttachImageButton.vue';
import ChatImageDropZone from './ChatImageDropZone.vue';
import ChatInput from './ChatInput.vue';
import ChatModelMenu from './ChatModelMenu.vue';
import ChatSendButton from './ChatSendButton.vue';

export default Vue.extend({
  name: 'ChatComposer',

  components: {
    ChatAttachImageButton,
    ChatImageDropZone,
    ChatInput,
    ChatModelMenu,
    ChatSendButton,
  },

  data(): { draft: string } {
    return {
      draft: '',
    };
  },

  computed: {
    pending(): boolean {
      return !!this.$store.state.chat.pending;
    },

    canSend(): boolean {
      return !!this.draft.trim() && !this.pending;
    },
  },

  methods: {
    focus(): void {
      (this.$refs.input as InstanceType<typeof ChatInput>).focus();
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
  padding: 10px 12px 12px;
  border-top: 1px solid var(--panel-border);
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

.chat-composer-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-composer-spacer {
  flex: 1;
}
</style>
