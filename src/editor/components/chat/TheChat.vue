<template>
  <div class="the-chat">
    <template v-if="status">
      <chat-change-key
        v-if="status.connected && changingKey"
        @close="changingKey = false"
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
          @change-key="changeKey"
        />
      </template>
      <chat-setup v-else />
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import type { ChatStatus } from '@stylebot/types';

import ChatChangeKey from './ChatChangeKey.vue';
import ChatClearConfirmation from './ChatClearConfirmation.vue';
import ChatSetup from './ChatSetup.vue';
import ChatThread from './ChatThread.vue';
import ChatComposer from './ChatComposer.vue';

export default Vue.extend({
  name: 'TheChat',

  components: {
    ChatChangeKey,
    ChatClearConfirmation,
    ChatSetup,
    ChatThread,
    ChatComposer,
  },

  data(): { confirmingClear: boolean; changingKey: boolean } {
    return {
      confirmingClear: false,
      changingKey: false,
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
    url(): void {
      this.confirmingClear = false;
      this.$store.dispatch('chat/load');
    },
  },

  mounted() {
    this.$store.dispatch('chat/load');
  },

  methods: {
    changeKey(): void {
      this.confirmingClear = false;
      this.changingKey = true;
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
