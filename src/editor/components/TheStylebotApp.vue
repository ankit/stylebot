<template>
  <theme-provider class="stylebot-app">
    <the-stylebot v-if="visible" />
    <the-keyboard-shortcuts />
    <the-help-dialog v-if="help" />
  </theme-provider>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotCommands } from '@stylebot/types';
import { ThemeProvider } from '@stylebot/components';

import TheStylebot from './TheStylebot.vue';
import TheHelpDialog from './shortcuts/TheHelpDialog.vue';
import TheKeyboardShortcuts from './shortcuts/TheKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'App',

  components: {
    ThemeProvider,
    TheStylebot,
    TheHelpDialog,
    TheKeyboardShortcuts,
  },

  computed: {
    visible(): boolean {
      return this.$store.state.visible;
    },

    commands(): StylebotCommands | undefined {
      return this.$store.state.commands;
    },

    help(): boolean {
      return this.$store.state.help;
    },
  },
});
</script>
