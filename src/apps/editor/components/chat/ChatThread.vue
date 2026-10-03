<template>
  <div ref="scroller" class="chat-thread" aria-live="polite">
    <div v-if="empty" class="chat-empty">
      <s-text variant="muted">{{ t('chat_empty_description') }}</s-text>
    </div>

    <template v-for="turn in turns">
      <chat-user-message
        v-if="turn.role === 'user'"
        :key="turn.id"
        :turn="turn"
      />
      <chat-reply
        v-else
        :key="turn.id"
        :turn="turn"
        :latest="turn.id === latestReplyId"
        :busy="!!pending"
      />
    </template>

    <chat-pending v-if="pending" :pending="pending" />
    <chat-error v-if="error" :error="error" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SText } from '@stylebot/components';
import type { ChatTurn } from '@stylebot/types';

import ChatError from './ChatError.vue';
import ChatPending from './ChatPending.vue';
import ChatReply from './ChatReply.vue';
import ChatUserMessage from './ChatUserMessage.vue';
import type { ChatError as ChatErrorState, ChatState } from '../../store/chat';

export default Vue.extend({
  name: 'ChatThread',

  components: {
    ChatError,
    ChatPending,
    ChatReply,
    ChatUserMessage,
    SText,
  },

  computed: {
    turns(): Array<ChatTurn> {
      return this.$store.state.chat.turns;
    },

    latestReplyId(): string {
      const replies = this.turns.filter(turn => turn.role === 'assistant');
      return replies[replies.length - 1]?.id ?? '';
    },

    pending(): ChatState['pending'] {
      return this.$store.state.chat.pending;
    },

    error(): ChatErrorState | null {
      return this.$store.state.chat.error;
    },

    empty(): boolean {
      return !this.turns.length && !this.pending && !this.error;
    },
  },

  watch: {
    turns: 'scrollToEnd',
    pending: 'scrollToEnd',
    error: 'scrollToEnd',
  },

  mounted() {
    this.scrollToEnd();
  },

  methods: {
    scrollToEnd(): void {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller as HTMLElement | undefined;

        if (scroller) {
          scroller.scrollTop = scroller.scrollHeight;
        }
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-thread {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 8px 24px var(--panel-gutter);
  scrollbar-gutter: stable;

  @include thin-scrollbar;
}

.chat-thread > :first-child {
  margin-top: auto;
}

.chat-reply + .chat-user-message {
  margin-top: 20px;
}

.chat-user-message + .chat-reply {
  margin-top: 8px;
}

.chat-thread > .chat-pending {
  margin-top: 8px;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
</style>
