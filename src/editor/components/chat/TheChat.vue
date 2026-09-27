<template>
  <div class="the-chat">
    <template v-if="status">
      <chat-providers
        v-if="status.connected && showingProviders"
        @close="showingProviders = false"
      />

      <template v-else-if="status.connected">
        <chat-clear-confirmation
          v-if="confirmingClear"
          @confirm="clear"
          @cancel="confirmingClear = false"
        />
        <chat-thread />
        <chat-composer
          @new-chat="confirmingClear = true"
          @providers="showProviders"
        />
      </template>
      <chat-setup v-else />
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import type { ChatStatus } from '@stylebot/types';

import ChatProviders from './ChatProviders.vue';
import ChatClearConfirmation from './ChatClearConfirmation.vue';
import ChatSetup from './ChatSetup.vue';
import ChatThread from './ChatThread.vue';
import ChatComposer from './ChatComposer.vue';

export default Vue.extend({
  name: 'TheChat',

  components: {
    ChatProviders,
    ChatClearConfirmation,
    ChatSetup,
    ChatThread,
    ChatComposer,
  },

  data(): { confirmingClear: boolean; showingProviders: boolean } {
    return {
      confirmingClear: false,
      showingProviders: false,
    };
  },

  computed: {
    status(): ChatStatus | null {
      return this.$store.state.chat.status;
    },

    url(): string {
      return this.$store.state.url;
    },
  },

  watch: {
    // Removing the last key turns Chat off; the next key starts in the chat.
    'status.connected'(connected: boolean): void {
      if (!connected) {
        this.showingProviders = false;
      }
    },

    url(): void {
      this.confirmingClear = false;
      this.$store.dispatch('chat/load');
    },
  },

  mounted() {
    this.$store.dispatch('chat/load');
  },

  methods: {
    showProviders(): void {
      this.confirmingClear = false;
      this.showingProviders = true;
    },

    clear(): void {
      this.confirmingClear = false;
      this.$store.dispatch('chat/newChat');
    },
  },
});
</script>

<style lang="scss" scoped>
.the-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
