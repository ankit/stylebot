<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

import { injectCSSIntoDocument } from '@stylebot/css';
import { apply as applyDarkMode } from '@stylebot/dark-mode';
import { apply as applyReadability } from '@stylebot/readability';

export default Vue.extend({
  name: 'TheChromeListener',

  created(): void {
    chrome.extension.onRequest.addListener((request, _, sendResponse) => {
      if (window !== window.top) {
        return;
      }

      if (request.name === 'toggle') {
        if (this.$store.state.visible) {
          this.$store.dispatch('closeStylebot');
        } else {
          this.$store.dispatch('openStylebot');
        }
      } else if (request.name === 'getIsStylebotOpen') {
        sendResponse(this.$store.state.visible);
      } else if (request.name === 'enableStyle') {
        injectCSSIntoDocument(request.css, request.url);

        if (request.url === this.$store.state.url) {
          this.$store.commit('setEnabled', true);
        }
      } else if (request.name === 'disableStyle') {
        injectCSSIntoDocument('', request.url);

        if (request.url === this.$store.state.url) {
          this.$store.commit('setEnabled', false);
        }
      } else if (request.name === 'tabUpdated') {
        if (this.$store.state.readability) {
          applyReadability();
        } else if (this.$store.state.darkMode) {
          applyDarkMode();
        }
      }
    });
  },
});
</script>
