<template>
  <div class="the-chat">
    <template v-if="status">
      <div v-if="status.connected" class="the-chat-conversation" />
      <chat-setup v-else />
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import type { ChatStatus } from '@stylebot/types';

import ChatSetup from './ChatSetup.vue';

export default Vue.extend({
  name: 'TheChat',

  components: {
    ChatSetup,
  },

  computed: {
    status(): ChatStatus | null {
      return this.$store.state.chat.status;
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
