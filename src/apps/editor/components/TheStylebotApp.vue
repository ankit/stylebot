<template>
  <s-theme-provider class="stylebot-app" :mode="appearance">
    <the-stylebot v-if="visible" />
    <the-keyboard-shortcuts />
  </s-theme-provider>
</template>

<script lang="ts">
import Vue from 'vue';
import type { StylebotCommands, StylebotAppearance } from '@stylebot/types';
import { SThemeProvider } from '@stylebot/components';

import TheStylebot from './TheStylebot.vue';
import TheKeyboardShortcuts from './shortcuts/TheKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'App',

  components: {
    SThemeProvider,
    TheStylebot,
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
            // Chat's fields focus themselves as they mount.
            if (this.$store.state.options?.mode === 'chat') {
              return;
            }

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
