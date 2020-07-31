<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';
import hotkeys from 'hotkeys-js';
import { StylebotCommands, StylebotCommandName } from '@stylebot/types';

import { disableStyle, enableStyle } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheGlobalKeyboardShortcuts',

  computed: {
    visible(): boolean {
      return this.$store.state.visible;
    },

    url(): string {
      return this.$store.state.url;
    },

    readability(): boolean {
      return this.$store.state.readability;
    },

    enabled(): boolean {
      return this.$store.state.enabled;
    },

    commands(): StylebotCommands {
      return this.$store.state.commands;
    },
  },

  mounted() {
    this.attach();
  },

  methods: {
    attach(): void {
      const names = Object.keys(this.commands) as Array<StylebotCommandName>;

      names.forEach(name => {
        if (this.commands[name]) {
          hotkeys(this.commands[name], () => {
            this.handleCommand(name);
          });
        }
      });
    },

    handleCommand(name: StylebotCommandName) {
      switch (name) {
        case 'stylebot':
          this.toggleStylebot();
          break;

        case 'style':
          this.toggleStyle();
          break;

        case 'readability':
          this.toggleReadability();
          break;

        case 'grayscale':
          this.toggleGrayscale();
          break;
      }
    },

    toggleStylebot() {
      if (this.visible) {
        this.$store.dispatch('closeStylebot');
      } else {
        this.$store.dispatch('openStylebot');
      }
    },

    toggleStyle() {
      if (this.enabled) {
        disableStyle(this.url);
      } else {
        enableStyle(this.url);
      }
    },

    toggleReadability() {
      if (this.readability) {
        this.$store.dispatch('applyReadability', false);
      } else {
        this.$store.dispatch('applyReadability', true);
      }
    },

    toggleGrayscale() {
      let percent = 0;
      if (!this.$store.getters.grayscale) {
        percent = 100;
      }

      this.$store.dispatch('applyFilter', {
        effectName: 'grayscale',
        percent,
      });
    },
  },
});
</script>
