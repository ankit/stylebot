<template>
  <div class="stylebot-code-editor-iframe">
    <iframe :src="src" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CodeEditorIframe',

  data(): { src: string } {
    // The iframe is a separate document, so the theme has to be passed in
    // explicitly — read once, since it can't change while open.
    const theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    return {
      src: chrome.runtime.getURL(`monaco-editor/iframe/index.html?theme=${theme}`),
    };
  },
});
</script>

<style lang="scss">
.stylebot-code-editor-iframe {
  height: calc(100% - 10px);

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    position: relative;
  }
}
</style>
