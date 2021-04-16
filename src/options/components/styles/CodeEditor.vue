<template>
  <code-editor-iframe />
</template>

<script lang="ts">
import Vue from 'vue';

import { IframeMessage, ParentUpdateCssMessage } from '@stylebot/monaco-editor';

import CodeEditorIframe from './CodeEditorIframe.vue';

export default Vue.extend({
  name: 'CodeEditor',

  components: {
    CodeEditorIframe,
  },

  props: {
    css: {
      type: String,
      required: true,
    },
  },

  created() {
    window.addEventListener('message', this.handleMessage);
  },

  beforeDestroy() {
    window.removeEventListener('message', this.handleMessage);
  },

  methods: {
    getIframeContentWindow(): Window | null | undefined {
      return this.$el.querySelector('iframe')?.contentWindow;
    },

    handleMessage(message: {
      source: Window | MessagePort | ServiceWorker | null;
      data: IframeMessage;
    }): void {
      switch (message.data.type) {
        case 'stylebotMonacoIframeLoaded':
          this.handleIframeLoaded();
          break;

        case 'stylebotMonacoIframeCssUpdated':
          this.handleIframeCssUpdate(message.data.css);
          break;
      }
    },

    handleIframeLoaded(): void {
      const message: ParentUpdateCssMessage = {
        css: this.css,
        type: 'stylebotCssUpdate',
      };

      const contentWindow = this.getIframeContentWindow();

      if (!contentWindow) {
        return;
      }

      contentWindow.postMessage(message, chrome.runtime.getURL('*'));
    },

    handleIframeCssUpdate(css: string): void {
      this.$emit('update', css);
    },
  },
});
</script>
