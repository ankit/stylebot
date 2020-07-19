<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotCommand } from '@stylebot/types';
import { injectCSSIntoDocument } from '@stylebot/css';
import { apply as applyReadability } from '@stylebot/readability';
import { disableStyle, enableStyle } from '../utils/chrome';

export default Vue.extend({
  name: 'TheChromeListener',

  created(): void {
    chrome.extension.onRequest.addListener((request, _, sendResponse) => {
      if (window !== window.top) {
        return;
      }

      if (request.name === 'toggle') {
        this.toggleStylebot();
      } else if (request.name === 'enableStyle') {
        this.enableStyle(request.css, request.url);
      } else if (request.name === 'disableStyle') {
        this.disableStyle(request.url);
      } else if (request.name === 'tabUpdated') {
        if (this.$store.state.readability) {
          applyReadability();
        }
      } else if (request.name === 'getIsStylebotOpen') {
        sendResponse(this.$store.state.visible);
      } else if (request.name === 'command') {
        this.handleCommand(request.command);
      }
    });
  },

  methods: {
    toggleStylebot() {
      if (this.$store.state.visible) {
        this.$store.dispatch('closeStylebot');
      } else {
        this.$store.dispatch('openStylebot');
      }
    },

    enableStyle(css: string, url: string) {
      injectCSSIntoDocument(css, url);

      if (url === this.$store.state.url) {
        this.$store.commit('setEnabled', true);
      }
    },

    disableStyle(url: string) {
      injectCSSIntoDocument('', url);

      if (url === this.$store.state.url) {
        this.$store.commit('setEnabled', false);
      }
    },

    toggleStyle() {
      if (!this.$store.state.url) {
        return;
      }

      if (this.$store.state.enabled) {
        disableStyle(this.$store.state.url);
      } else {
        enableStyle(this.$store.state.url);
      }
    },

    toggleReadability() {
      if (this.$store.state.readability) {
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
