<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

import { injectCSSIntoDocument } from '@stylebot/css';
import { StylebotCommand, TabMessage } from '@stylebot/types';
import { apply as applyReadability } from '@stylebot/readability';

import { disableStyle, enableStyle } from '../utils/chrome';

export default Vue.extend({
  name: 'TheChromeListener',

  computed: {
    enabled(): boolean {
      return this.$store.state.enabled;
    },

    readability(): boolean {
      return this.$store.state.readability;
    },

    visible(): boolean {
      return this.$store.state.visible;
    },

    url(): string {
      return this.$store.state.url;
    },
  },

  created(): void {
    chrome.runtime.onMessage.addListener(
      (message: TabMessage, _, sendResponse: (response: boolean) => void) => {
        if (window !== window.top) {
          return;
        }

        if (message.name === 'ToggleStylebot') {
          this.toggleStylebot();
        } else if (message.name === 'OpenStylebot') {
          if (!this.visible) {
            this.toggleStylebot();
          }
        } else if (message.name === 'EnableStyleForTab') {
          this.enableStyle(message.css, message.url);
        } else if (message.name === 'DisableStyleForTab') {
          this.disableStyle(message.url);
        } else if (message.name === 'TabUpdated') {
          if (this.readability) {
            applyReadability();
          }
        } else if (message.name === 'GetIsStylebotOpen') {
          sendResponse(this.visible);
        } else if (message.name === 'ExecuteCommand') {
          this.handleCommand(message.command);
        } else if (message.name === 'ToggleReadabilityForTab') {
          this.toggleReadability();
        }
      }
    );
  },

  methods: {
    toggleStylebot() {
      if (this.visible) {
        this.$store.dispatch('closeStylebot');
      } else {
        this.$store.dispatch('openStylebot');
      }
    },

    enableStyle(css: string, url: string) {
      injectCSSIntoDocument(css, url);

      if (url === this.url) {
        this.$store.commit('setEnabled', true);
      }
    },

    disableStyle(url: string) {
      injectCSSIntoDocument('', url);

      if (url === this.url) {
        this.$store.commit('setEnabled', false);
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
      // todo
    },

    handleCommand(command: StylebotCommand) {
      if (command === 'toggle-stylebot') {
        this.toggleStylebot();
      } else if (command === 'toggle-style') {
        this.toggleStyle();
      } else if (command === 'toggle-readability') {
        this.toggleReadability();
      } else if (command === 'toggle-grayscale') {
        this.toggleGrayscale();
      }
    },
  },
});
</script>
