<template>
  <div class="stylebot-code-editor-iframe" :class="{ ready }">
    <iframe :src="src" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { IframeMessage } from '@stylebot/monaco-editor';

export default Vue.extend({
  name: 'CodeEditorIframe',

  data(): { src: string; ready: boolean } {
    // The iframe is a separate document, so the theme has to be passed in
    // explicitly — read once, since it can't change while open.
    const theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    return {
      // Separate entry from the in-page editor's iframe (index.html) — see MonacoEditorIframe.ts.
      src: chrome.runtime.getURL(`monaco-editor/iframe/options-index.html?theme=${theme}`),
      ready: false,
    };
  },

  created() {
    window.addEventListener('message', this.handleMessage);
  },

  beforeDestroy() {
    window.removeEventListener('message', this.handleMessage);
  },

  methods: {
    // Monaco loads asynchronously — fade the iframe in once it's ready.
    handleMessage(message: { data: IframeMessage }): void {
      if (message.data.type === 'stylebotMonacoIframeLoaded') {
        this.ready = true;
      }
    },
  },
});
</script>

<style lang="scss">
.stylebot-code-editor-iframe {
  height: calc(100% - 5px);

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    position: relative;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &.ready iframe {
    opacity: 1;
  }
}
</style>
