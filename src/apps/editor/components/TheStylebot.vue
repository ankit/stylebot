<template>
  <the-stylebot-resizer>
    <div class="stylebot-content">
      <the-window-status v-if="host !== 'page' && !pageConnected" />

      <the-keyboard-shortcuts-view v-if="help" />

      <template v-else>
        <the-header ref="header" />

        <div
          class="stylebot-body"
          :style="
            colorPickerVisible || !pageConnected ? 'pointer-events: none' : ''
          "
        >
          <the-basic-editor v-if="mode === 'basic'" />
          <the-presets-editor v-else-if="mode === 'magic'" />

          <!-- Stays mounted (just hidden) once opened — Monaco is too expensive to reload on every mode switch. -->
          <the-code-editor
            v-if="codeEditorMounted"
            v-show="mode === 'code'"
            @leave="onCodeEditorLeave"
          />
        </div>

        <the-gallery-status />
      </template>
    </div>
  </the-stylebot-resizer>
</template>

<script lang="ts">
import Vue from 'vue';

import TheHeader from './TheHeader.vue';
import TheCodeEditor from './TheCodeEditor.vue';
import TheBasicEditor from './TheBasicEditor.vue';
import ThePresetsEditor from './ThePresetsEditor.vue';
import TheStylebotResizer from './TheStylebotResizer.vue';
import TheWindowStatus from './TheWindowStatus.vue';
import TheKeyboardShortcutsView from './shortcuts/TheKeyboardShortcutsView.vue';
import TheGalleryStatus from './publish/TheGalleryStatus.vue';

import type { StylebotEditingMode } from '@stylebot/types';

type HeaderRef = { focusModeTab(): void };

export default Vue.extend({
  name: 'TheStylebot',

  components: {
    TheHeader,
    TheBasicEditor,
    ThePresetsEditor,
    TheCodeEditor,
    TheStylebotResizer,
    TheWindowStatus,
    TheKeyboardShortcutsView,
    TheGalleryStatus,
  },

  data(): { codeEditorMounted: boolean } {
    return {
      codeEditorMounted: false,
    };
  },

  computed: {
    host(): string {
      return this.$store.state.host;
    },

    pageConnected(): boolean {
      return this.$store.state.pageConnected;
    },

    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    colorPickerVisible(): boolean {
      return this.$store.state.colorPickerVisible;
    },

    help(): boolean {
      return this.$store.state.help;
    },

    galleryKey(): string {
      const { url, activeProfile } = this.$store.state;

      return JSON.stringify([url, activeProfile]);
    },
  },

  watch: {
    // Reloads what was published as the profile changes.
    galleryKey: {
      immediate: true,
      handler(): void {
        this.$store.dispatch('loadPublishedGalleryStyle');
      },
    },

    mode: {
      immediate: true,
      handler(mode: StylebotEditingMode): void {
        if (mode === 'code') {
          this.codeEditorMounted = true;
        }
      },
    },
  },

  methods: {
    onCodeEditorLeave(): void {
      (this.$refs.header as unknown as HeaderRef).focusModeTab();
    },
  },
});
</script>

<style lang="scss">
.stylebot {
  --panel-gutter: 16px;

  top: 0;
  padding: 0;
  color: var(--text-primary);
  line-height: 20px;
  background: var(--panel-surface);
}

.stylebot-content {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.stylebot-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;

  @include thin-scrollbar;
}
</style>
