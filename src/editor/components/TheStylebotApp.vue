<template>
  <div>
    <the-stylebot v-if="visible" />

    <the-chrome-listener />
    <the-context-menu-listener />
    <the-keyboard-shortcuts />
    <the-global-keyboard-shortcuts v-if="commands" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotCommands } from '@stylebot/types';

import TheStylebot from './TheStylebot.vue';
import TheChromeListener from './TheChromeListener.vue';
import TheContextMenuListener from './TheContextMenuListener.vue';
import TheKeyboardShortcuts from './shortcuts/TheKeyboardShortcuts.vue';
import TheGlobalKeyboardShortcuts from './shortcuts/TheGlobalKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'App',

  components: {
    TheStylebot,
    TheChromeListener,
    TheContextMenuListener,
    TheKeyboardShortcuts,
    TheGlobalKeyboardShortcuts,
  },

  computed: {
    visible(): boolean {
      return this.$store.state.visible;
    },

    commands(): StylebotCommands | undefined {
      return this.$store.state.commands;
    },
  },

  async created(): Promise<void> {
    this.$store.dispatch('initialize');
  },
});
</script>
