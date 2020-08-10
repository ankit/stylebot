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
    return {
      src: chrome.runtime.getURL('monaco-editor/iframe/index.html'),
    };
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
