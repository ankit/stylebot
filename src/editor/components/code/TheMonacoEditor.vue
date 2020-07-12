<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

import {
  IframeMessageType,
  ParentUpdateCssMessage,
} from './../../../monaco-editor/types';

export default Vue.extend({
  name: 'TheMonacoEditor',

  props: {
    css: {
      type: String,
      required: true,
    },

    position: {
      type: String,
      required: true,
    },
  },

  watch: {
    position(): void {
      const iframe = this.getIframe();

      if (iframe) {
        this.setInlineStyleForIframe(iframe);
      }
    },
  },

  created() {
    this.attachListeners();
    this.injectIframe();
  },

  beforeDestroy() {
    this.detachListeners();
    this.hideIframe();
  },

  methods: {
    getShadowRoot(): ShadowRoot | null | undefined {
      return document.getElementById('stylebot')?.shadowRoot;
    },

    getIframe(): HTMLIFrameElement | null | undefined {
      return this.getShadowRoot()?.getElementById(
        'stylebot-monaco-editor'
      ) as HTMLIFrameElement;
    },

    injectIframe(): void {
      let iframe = this.getIframe();

      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'stylebot-monaco-editor';
        iframe.setAttribute(
          'src',
          chrome.runtime.getURL('monaco-editor/iframe/index.html')
        );

        this.setInlineStyleForIframe(iframe);
        this.getShadowRoot()?.appendChild(iframe);
      } else {
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

    handleMessage(message: { data: IframeMessageType }): void {
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

    setInlineStyleForIframe(iframe: HTMLIFrameElement): void {
      iframe.setAttribute(
        'style',
        this.position === 'left' ? 'left: 0' : 'right: 0'
      );
    },
  },
});
</script>

<style lang="scss">
// todo: make the dimensions more dynamic
#stylebot-monaco-editor {
  border: 0px none;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 77px;
  width: 375px;
  z-index: 100000000000;
  height: calc(100% - 154px);

  &.hidden {
    display: none;
  }
}
</style>
