<template>
  <theme-provider class="stylebot-app" :mode="appearance">
    <the-stylebot v-if="visible" />
    <the-keyboard-shortcuts />
    <the-help-dialog v-if="help" />
  </theme-provider>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotCommands, StylebotAppearance } from '@stylebot/types';
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

  data(): { previouslyFocused: HTMLElement | null } {
    return {
      previouslyFocused: null,
    };
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

    appearance(): StylebotAppearance {
      return this.$store.state.options?.appearance ?? 'system';
    },
  },

  watch: {
    // immediate: initEditor's async mount means `visible` is already true the first time this watcher is set up.
    visible: {
      immediate: true,
      handler(visible: boolean): void {
        if (visible) {
          this.previouslyFocused =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;

          this.$nextTick(() => {
            const inspector = this.$el.querySelector<HTMLElement>(
              '.stylebot-inspector'
            );
            inspector?.focus();
          });
        } else {
          this.previouslyFocused?.focus();
          this.previouslyFocused = null;
        }
      },
    },
  },
});
</script>
