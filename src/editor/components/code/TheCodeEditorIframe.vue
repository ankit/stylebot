<template>
  <div class="stylebot-code-editor-iframe" />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheCodeEditorIframe',

  mounted() {
    this.initIframe();
  },

  methods: {
    initIframe() {
      const src = chrome.runtime.getURL('monaco-editor/iframe/index.html');
      const iframeEl = document.createElement('iframe');

      iframeEl.setAttribute('src', src);
      this.$el.appendChild(iframeEl);
    },
  },
});
</script>

<style lang="scss">
.stylebot-code-editor-iframe {
  height: 100%;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    position: relative;
  }
}
</style>
