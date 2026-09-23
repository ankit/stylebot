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
import { debounce, Debounced } from '@stylebot/utils';

import CodeEditorIframe from './code/CodeEditorIframe.vue';

// Typing applies once it pauses, so the page doesn't flash through every
// partial selector on the way (`d`, `di`, `div`).
const TYPING_DEBOUNCE_MS = 200;

export default Vue.extend({
  name: 'TheCodeEditor',

  components: {
    CodeEditorIframe,
  },

  data(): { iframeCss: string | null; applyTypedCss: Debounced<[string]> } {
    return {
      // What the iframe last showed, whether it reported it or we sent it.
      iframeCss: null,
      applyTypedCss: debounce((css: string) => {
        // Skips Monaco's echo of a setValue: re-saving it would stamp a fresh
        // modifiedTime on a just-pulled style, as if this device edited it.
        if (css !== this.$store.state.css) {
          this.$store.dispatch('applyCss', { css });
        }
      }, TYPING_DEBOUNCE_MS),
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
      // Applies what was just typed before the css it is based on is read
      // and pushed back into the editor.
      this.applyTypedCss.flush();

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
      } else {
        this.applyTypedCss.flush();
      }
    },

    css(value: string): void {
      // Edits typed into Monaco reach the store through handleIframeCssUpdate
      // and already match the iframe. Anything else changed the css from
      // outside — a delete from basic mode, or a sync pull replacing the
      // style — and has to be pushed down or the editor keeps stale text.
      if (value === this.iframeCss) {
        return;
      }

      // The outside change wins over typing it is about to replace.
      this.applyTypedCss.cancel();

      const contentWindow = this.getIframeContentWindow();
      if (contentWindow) {
        this.updateIframeCss(contentWindow, false);
      }
    },
  },

  created() {
    window.addEventListener('message', this.handleMessage);
    this.pruneEmptyRules();
  },

  beforeDestroy() {
    this.applyTypedCss.flush();
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
          this.applyTypedCss.flush();
          this.$store.dispatch('escape');
          break;
      }
    },

    handleIframeLoaded(): void {
      this.handleActiveSelectorChange(this.activeSelector);
    },

    handleIframeCssUpdate(css: string): void {
      this.iframeCss = css;
      this.applyTypedCss(css);
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
