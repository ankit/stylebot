<template>
  <div class="the-chat">
    <template v-if="status">
      <template v-if="status.connected">
        <chat-thread />
        <chat-composer />
      </template>
      <chat-setup v-else />
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import type { ChatStatus } from '@stylebot/types';

import ChatSetup from './ChatSetup.vue';
import ChatThread from './ChatThread.vue';
import ChatComposer from './ChatComposer.vue';

export default Vue.extend({
  name: 'TheChat',

  components: {
    ChatSetup,
    ChatThread,
    ChatComposer,
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
      this.$store.dispatch('chat/load');
    },
  },

  mounted() {
    this.$store.dispatch('chat/load');
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
