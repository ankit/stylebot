<template>
  <div class="chat-composer">
    <chat-image-drop-zone class="chat-composer-box" @change="focus">
      <chat-input ref="input" v-model="draft" @submit="send" />

      <div class="chat-composer-footer">
        <chat-attach-image-button @change="focus" />
        <chat-model-menu
          @new-chat="$emit('new-chat')"
          @change-key="$emit('change-key')"
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
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 8px 12px;
  @include field-border(12px);
  background: var(--field-fill);

  &:hover {
    border-color: var(--field-border-hover);
  }

  &:focus-within,
  &.dropping {
    @include field-active-border;
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
