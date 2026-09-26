<template>
  <div class="chat-composer">
    <div class="chat-composer-box">
      <chat-input v-model="draft" @submit="send" />

      <div class="chat-composer-footer">
        <span class="chat-composer-spacer" />
        <chat-send-button
          :pending="pending"
          :disabled="!canSend"
          @send="send"
          @stop="stop"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import ChatInput from './ChatInput.vue';
import ChatSendButton from './ChatSendButton.vue';

export default Vue.extend({
  name: 'ChatComposer',

  components: {
    ChatInput,
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
    stop(): void {
      this.$store.dispatch('chat/stop');
    },

    send(): void {
      if (!this.canSend) {
        return;
      }

      this.$store.dispatch('chat/send', this.draft);
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
  border: 1px solid var(--field-border);
  border-radius: 12px;
  background: var(--field-fill);

  &:hover {
    border-color: var(--field-border-hover);
  }

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
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
