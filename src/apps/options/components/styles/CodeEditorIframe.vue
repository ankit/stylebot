<template>
  <div class="stylebot-code-editor-iframe" :class="{ ready }">
    <iframe ref="iframe" :src="src" />
    <span ref="exit" class="exit" tabindex="-1" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type {
  IframeMessage,
  ParentThemeUpdateMessage,
} from '@stylebot/monaco-editor';
import { resolveAppearance, getSystemPreference } from '@stylebot/utils';
import type { StylebotAppearance, StylebotCodeTheme } from '@stylebot/types';

export default Vue.extend({
  name: 'CodeEditorIframe',

  data(): {
    src: string;
    ready: boolean;
    systemPreference: 'light' | 'dark';
    mql: MediaQueryList | null;
  } {
    // The iframe is a separate document, so the initial theme has to be
    // passed in via the URL to avoid a flash before Monaco loads. Later
    // changes are pushed live — see the resolvedTheme watcher below.
    const appearance = this.$store.state.options?.appearance ?? 'system';
    const theme = resolveAppearance(appearance, getSystemPreference());
    const codeTheme = this.$store.state.options?.codeTheme ?? 'stylebot';

    return {
      // Separate entry from the in-page editor's iframe (index.html) — see MonacoEditorIframe.ts.
      src: chrome.runtime.getURL(
        `monaco-editor/iframe/options-index.html?theme=${theme}&codeTheme=${codeTheme}`
      ),
      ready: false,
      systemPreference: getSystemPreference(),
      mql: null,
    };
  },

  computed: {
    appearance(): StylebotAppearance {
      return this.$store.state.options?.appearance ?? 'system';
    },

    resolvedTheme(): 'light' | 'dark' {
      return resolveAppearance(this.appearance, this.systemPreference);
    },

    codeTheme(): StylebotCodeTheme {
      return this.$store.state.options?.codeTheme ?? 'stylebot';
    },
  },

  watch: {
    resolvedTheme(theme: 'light' | 'dark') {
      this.postTheme(theme);
    },

    codeTheme() {
      this.postTheme(this.resolvedTheme);
    },
  },

  created() {
    window.addEventListener('message', this.handleMessage);
  },

  mounted() {
    this.mql = window.matchMedia('(prefers-color-scheme: dark)');
    this.mql.addEventListener('change', this.onSystemThemeChange);
  },

  beforeDestroy() {
    window.removeEventListener('message', this.handleMessage);
    this.mql?.removeEventListener('change', this.onSystemThemeChange);
  },

  methods: {
    onSystemThemeChange(event: MediaQueryListEvent): void {
      this.systemPreference = event.matches ? 'dark' : 'light';
    },

    // Monaco loads asynchronously — fade the iframe in once it's ready.
    handleMessage(message: { data: IframeMessage }): void {
      if (message.data.type === 'stylebotMonacoIframeLoaded') {
        this.ready = true;
        // Covers a theme change that happened while the iframe was still loading.
        this.postTheme(this.resolvedTheme);
      } else if (message.data.type === 'stylebotEscapePressed') {
        // Tab indents inside Monaco, so Escape steps just past it instead.
        (this.$refs.exit as HTMLElement).focus();
      }
    },

    postTheme(theme: 'light' | 'dark'): void {
      const message: ParentThemeUpdateMessage = {
        type: 'stylebotThemeUpdate',
        theme,
        codeTheme: this.codeTheme,
      };
      (this.$refs.iframe as HTMLIFrameElement).contentWindow?.postMessage(
        message,
        '*'
      );
    },
  },
});
</script>

<style lang="scss">
.stylebot-code-editor-iframe {
  height: 100%;
  position: relative;

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

  .exit {
    position: absolute;
    inset: 0;
    pointer-events: none;

    @include focus-ring;
  }
}
</style>
