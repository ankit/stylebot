<template>
  <the-code-editor-iframe />
</template>

<script lang="ts">
import Vue from 'vue';
import TheCodeEditorIframe from './code/TheCodeEditorIframe.vue';

import {
  IframeMessageType,
  ParentUpdateCssMessage,
} from './../../monaco-editor/types';

export default Vue.extend({
  name: 'TheCodeEditor',

  components: {
    TheCodeEditorIframe,
  },

  computed: {
    css(): string {
      return this.$store.state.css;
    },
  },

  watch: {
    css(value: string): void {
      const iframe = this.$el.querySelector('iframe');

      // only handle the case where the css is deleted by the user
      // from outside of the code editor. else, this will get invoked on every edit.
      if (value === '' && iframe?.contentWindow) {
        this.updateCssInMonacoEditor(iframe?.contentWindow);
      }
    },
  },

  created() {
    this.attachListeners();
  },

  beforeDestroy() {
    this.detachListeners();
  },

  methods: {
    attachListeners(): void {
      window.addEventListener('message', this.handleMessage);
    },

    detachListeners(): void {
      window.removeEventListener('message', this.handleMessage);
    },

    handleMessage(message: {
      source: Window | MessagePort | ServiceWorker | null;
      data: IframeMessageType;
    }): void {
      if (message.data.type === 'stylebotMonacoIframeLoaded') {
        this.updateCssInMonacoEditor(message.source as Window);
      } else if (message.data.type === 'stylebotMonacoIframeCssUpdated') {
        this.$store.dispatch('applyCss', { css: message.data.css });
      }
    },

    updateCssInMonacoEditor(iframeContentWindow: Window): void {
      const message: ParentUpdateCssMessage = {
        css: this.css,
        type: 'stylebotCssUpdate',
      };

      iframeContentWindow.postMessage(message, chrome.runtime.getURL('*'));
    },
  },
});
</script>
