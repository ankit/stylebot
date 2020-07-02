<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheChromeListener',

  created(): void {
    chrome.extension.onRequest.addListener(request => {
      if (window !== window.top) {
        return;
      }

      if (request.name === 'toggle') {
        this.$store.commit('toggleStylebot');
      }
    });
  },
});
</script>
