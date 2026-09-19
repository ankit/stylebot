<template>
  <code-editor-iframe id="stylebot-selector-css" />
</template>

<script lang="ts">
import Vue from 'vue';

import {
  getRule,
  getRuleForSelector,
  splitSelectorFromGroup,
  addEmptyRule,
  removeEmptyRules,
} from '@stylebot/css';
import {
  IframeMessage,
  ParentUpdateCssMessage,
  ParentFocusEditorMessage,
} from '@stylebot/monaco-editor';

import CodeEditorIframe from './code/CodeEditorIframe.vue';

export default Vue.extend({
  name: 'TheCodeEditor',

  components: {
    CodeEditorIframe,
  },

  computed: {
    css(): string {
      return this.$store.state.css;
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    mode(): string {
      return this.$store.state.options.mode;
    },
  },

  watch: {
    activeSelector(selector: string): void {
      // remove any previous injected empty rules if a new selector was selected
      if (selector) {
        const css = removeEmptyRules(this.css);
        this.$store.dispatch('applyCss', { css });
      }

      this.handleActiveSelectorChange(selector);
    },

    // The editor stays mounted across mode switches, so re-entering Code mode
    // doesn't naturally refocus it the way a fresh mount used to.
    mode(mode: string): void {
      if (mode === 'code') {
        this.focusIframe();
      }
    },

    css(value: string): void {
      const contentWindow = this.getIframeContentWindow();

      // only handle the case where the css is deleted by the user
      // from outside of the code editor. else, this will get invoked on every edit.
      if (value === '' && contentWindow) {
        this.updateIframeCss(contentWindow);
      }
    },
  },

  created() {
    window.addEventListener('message', this.handleMessage);
    // remove any previous injected empty rules
    const css = removeEmptyRules(this.css);
    this.$store.dispatch('applyCss', { css });
  },

  beforeDestroy() {
    window.removeEventListener('message', this.handleMessage);
  },

  methods: {
    getIframeContentWindow(): Window | null | undefined {
      return this.$el.querySelector('iframe')?.contentWindow;
    },

    updateIframeCss(contentWindow: Window): void {
      const message: ParentUpdateCssMessage = {
        css: this.css,
        type: 'stylebotCssUpdate',
        selector: this.activeSelector,
      };

      contentWindow.postMessage(message, chrome.runtime.getURL('*'));
    },

    focusIframe(): void {
      const contentWindow = this.getIframeContentWindow();

      if (contentWindow) {
        const message: ParentFocusEditorMessage = {
          type: 'stylebotFocusEditor',
        };
        contentWindow.postMessage(message, chrome.runtime.getURL('*'));
      }
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

        case 'stylebotEscapePressed':
          this.$store.dispatch('escape');
          break;
      }
    },

    handleIframeLoaded(): void {
      this.handleActiveSelectorChange(this.activeSelector);
    },

    handleIframeCssUpdate(css: string): void {
      this.$store.dispatch('applyCss', { css });
    },

    handleActiveSelectorChange(selector: string): void {
      const contentWindow = this.getIframeContentWindow();

      if (!contentWindow) {
        return;
      }

      if (selector && !getRule(this.css, selector)) {
        /* Already styled via a grouped rule — split it out rather than
           appending a second, blank `.foo {}` at the bottom. */
        const css = getRuleForSelector(this.css, selector)
          ? splitSelectorFromGroup(this.css, selector)
          : addEmptyRule(this.css, selector);

        this.$store.dispatch('applyCss', { css });
      }

      this.updateIframeCss(contentWindow);
    },
  },
});
</script>
