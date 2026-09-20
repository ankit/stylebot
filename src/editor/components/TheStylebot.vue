<template>
  <the-stylebot-resizer>
    <div class="stylebot-content">
      <the-window-tab-bar v-if="host === 'window'" />
      <the-header />

      <the-window-status v-if="host === 'window' && !pageConnected" />

      <div
        class="stylebot-body"
        :style="
          colorPickerVisible || !pageConnected ? 'pointer-events: none' : ''
        "
      >
        <the-basic-editor v-if="mode === 'basic'" />
        <the-presets-editor v-else-if="mode === 'magic'" />

        <!-- Stays mounted (just hidden) once opened — Monaco is too expensive to reload on every mode switch/resize. -->
        <the-code-editor
          v-if="codeEditorMounted"
          v-show="mode === 'code' && !resizing"
        />
      </div>
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
import TheWindowTabBar from './TheWindowTabBar.vue';

import { StylebotEditingMode } from '@stylebot/types';

export default Vue.extend({
  name: 'TheStylebot',

  components: {
    TheHeader,
    TheBasicEditor,
    ThePresetsEditor,
    TheCodeEditor,
    TheStylebotResizer,
    TheWindowStatus,
    TheWindowTabBar,
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

    resizing(): boolean {
      return this.$store.state.resizing;
    },

    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    colorPickerVisible(): boolean {
      return this.$store.state.colorPickerVisible;
    },
  },

  watch: {
    mode: {
      immediate: true,
      handler(mode: StylebotEditingMode): void {
        if (mode === 'code') {
          this.codeEditorMounted = true;
        }
      },
    },
  },
});
</script>

<style lang="scss">
.stylebot {
  top: 0;
  padding: 0;
  color: var(--text-primary);
  line-height: 20px;
  background: var(--panel-surface);
}

.stylebot-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.stylebot-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
