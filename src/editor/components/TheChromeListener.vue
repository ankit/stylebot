<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheChromeListener',

  created(): void {
    chrome.extension.onRequest.addListener((request, _, sendResponse) => {
      if (window !== window.top) {
        return;
      }

      if (request.name === 'toggle') {
        if (this.$store.state.visible) {
          this.$store.dispatch('hideStylebot');
        } else {
          this.$store.dispatch('showStylebot');
        }
      } else if (request.name === 'getIsStylebotOpen') {
        sendResponse(this.$store.state.visible);
      } else if (request.name === 'updateCss') {
        this.$store.commit('setUrl', request.url);
        this.$store.dispatch('injectCss', request.css);
      }
    });
  },
});
</script>
