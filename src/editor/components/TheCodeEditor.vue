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

  data(): { iframeCss: string | null } {
    return {
      // What the iframe last showed, whether it reported it or we sent it.
      iframeCss: null,
    };
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
      if (selector) {
        this.pruneEmptyRules();
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

      // Edits typed into Monaco reach the store through handleIframeCssUpdate
      // and already match the iframe. Anything else changed the css from
      // outside — a delete from basic mode, or a sync pull replacing the
      // style — and has to be pushed down or the editor keeps stale text.
      if (contentWindow && value !== this.iframeCss) {
        this.updateIframeCss(contentWindow, false);
      }
    },
  },

  created() {
    window.addEventListener('message', this.handleMessage);
    this.pruneEmptyRules();
  },

  beforeDestroy() {
    window.removeEventListener('message', this.handleMessage);
  },

  methods: {
    /**
     * Drops the blank rules a previous selector left behind, saving only if
     * that changed something: saving empty css would delete the style.
     */
    pruneEmptyRules(): void {
      const css = removeEmptyRules(this.css);

      if (css !== this.css) {
        this.$store.dispatch('applyCss', { css });
      }
    },

    getIframeContentWindow(): Window | null | undefined {
      return this.$el.querySelector('iframe')?.contentWindow;
    },

    updateIframeCss(contentWindow: Window, focus = true): void {
      const message: ParentUpdateCssMessage = {
        css: this.css,
        type: 'stylebotCssUpdate',
        selector: this.activeSelector,
        focus,
      };

      this.iframeCss = this.css;
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
      this.iframeCss = css;

      // Monaco echoes a setValue back as a content change. Re-applying it
      // would save the css again and stamp a fresh modifiedTime on a style
      // that was just pulled, making this device look like it edited it.
      if (css === this.css) {
        return;
      }

      this.$store.dispatch('applyCss', { css });
    },

    handleActiveSelectorChange(selector: string): void {
      const contentWindow = this.getIframeContentWindow();

      if (!contentWindow) {
        return;
      }

      if (selector && !getRule(this.css, selector)) {
        // Already styled via a grouped rule — split it out rather than
        // appending a second, blank `.foo {}` at the bottom.
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
