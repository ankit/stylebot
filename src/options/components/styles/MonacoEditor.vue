<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';
import { IframeMessage, ParentUpdateCssMessage } from '@stylebot/monaco-editor';

export default Vue.extend({
  name: 'MonacoEditor',

  props: {
    css: {
      type: String,
      required: true,
    },
  },

  created() {
    this.attachListeners();
    this.showIframe();
  },

  beforeDestroy() {
    this.detachListeners();
    this.hideIframe();
  },

  methods: {
    getIframe(): HTMLIFrameElement | null {
      return document.getElementById(
        'stylebot-monaco-editor'
      ) as HTMLIFrameElement;
    },

    showIframe(): void {
      let iframe = this.getIframe();
      if (iframe) {
        iframe.classList.remove('hidden');
        this.updateCssInMonacoEditor();
      }
    },

    hideIframe(): void {
      const iframe = this.getIframe();
      if (iframe) {
        iframe.classList.add('hidden');
      }
    },

    attachListeners(): void {
      window.addEventListener('message', this.handleMessage);
    },

    detachListeners(): void {
      window.removeEventListener('message', this.handleMessage);
    },

    handleMessage(message: { data: IframeMessage }): void {
      if (message.data.type === 'stylebotMonacoIframeLoaded') {
        this.updateCssInMonacoEditor();
      } else if (message.data.type === 'stylebotMonacoIframeCssUpdated') {
        this.$emit('update', message.data.css);
      }
    },

    updateCssInMonacoEditor(): void {
      const message: ParentUpdateCssMessage = {
        css: this.css,
        type: 'stylebotCssUpdate',
      };

      // todo: why is typescript not picking up the type of iframe here?
      (this.getIframe() as HTMLIFrameElement)?.contentWindow?.postMessage(
        message,
        chrome.runtime.getURL('*')
      );
    },
  },
});
</script>
