<template>
  <div
    class="the-chat"
    :class="{ conversation: status && status.connected && !showingProviders }"
  >
    <template v-if="status">
      <chat-providers
        v-if="status.connected && showingProviders"
        @close="showingProviders = false"
      />

      <template v-else-if="status.connected">
        <chat-clear-confirmation
          v-if="confirmingClear"
          @confirm="clear"
          @cancel="setConfirmingClear(false)"
        />
        <chat-thread @fill="fill" />
        <chat-composer ref="composer" @providers="showProviders" />
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

  data(): { showingProviders: boolean } {
    return {
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

    confirmingClear(): boolean {
      return this.$store.state.chat.confirmingClear;
    },
  },

  watch: {
    // Removing the last key turns Chat off; the next key starts in the chat.
    'status.connected'(connected: boolean): void {
      if (!connected) {
        this.showingProviders = false;
      }
    },

    // New chat in the tab bar can ask while the providers are open.
    confirmingClear(confirming: boolean): void {
      if (confirming) {
        this.showingProviders = false;
      }
    },

    url(): void {
      this.setConfirmingClear(false);
      this.$store.dispatch('chat/load');
    },
  },

  mounted() {
    this.$store.dispatch('chat/load');
  },

  beforeDestroy() {
    this.setConfirmingClear(false);
  },

  methods: {
    setConfirmingClear(value: boolean): void {
      this.$store.commit('chat/setConfirmingClear', value);
    },

    showProviders(): void {
      this.setConfirmingClear(false);
      this.showingProviders = true;
    },

    fill(text: string): void {
      (this.$refs.composer as InstanceType<typeof ChatComposer>).fill(text);
    },

    clear(): void {
      this.setConfirmingClear(false);
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

  &.conversation {
    --tab-surface: var(--chat-surface);
    --chat-gutter: calc(var(--panel-gutter) + 4px);

    background: var(--tab-surface);
  }
}
</style>
