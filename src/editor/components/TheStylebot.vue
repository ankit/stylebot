<template>
  <vue-draggable-resizable
    class="stylebot"
    :z="100000000"
    :w="width"
    :h="height"
    :x="x"
    :y="y"
    :drag-handle="`.move-window-action`"
    @dragging="onDragging"
    @dragstop="onDragStop"
    @resizing="onResizing"
    @resizestop="onResizeStop"
  >
    <the-header />

    <div class="stylebot-body">
      <the-basic-editor v-if="mode === 'basic'" />
      <the-magic-editor v-else-if="mode === 'magic'" />
      <the-code-editor v-else-if="mode === 'code' && !dragging && !resizing" />
    </div>

    <the-footer />

    <the-help-dialog v-if="help" />
  </vue-draggable-resizable>
</template>

<script lang="ts">
import Vue from 'vue';

import TheHeader from './TheHeader.vue';
import TheFooter from './TheFooter.vue';

import TheCodeEditor from './TheCodeEditor.vue';
import TheBasicEditor from './TheBasicEditor.vue';
import TheMagicEditor from './TheMagicEditor.vue';

import TheHelpDialog from './shortcuts/TheHelpDialog.vue';

import { StylebotPlacement, StylebotEditingMode } from '@stylebot/types';

export default Vue.extend({
  name: 'TheStylebot',

  components: {
    TheHeader,
    TheFooter,
    TheBasicEditor,
    TheMagicEditor,
    TheCodeEditor,
    TheHelpDialog,
  },

  data: () => {
    return {
      width: 320,
      height: window.innerHeight - 60,
      x: window.innerWidth - 380,
      y: 30,
      dragging: false,
      resizing: false,
    };
  },

  computed: {
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    position(): StylebotPlacement {
      return this.$store.state.position;
    },

    help(): boolean {
      return this.$store.state.help;
    },
  },

  methods: {
    onDragging() {
      this.dragging = true;
    },
    onDragStop(x: number, y: number) {
      console.log(x, y);
      this.dragging = false;
    },
    onResizing() {
      this.resizing = true;
    },
    onResizeStop(x: number, y: number, width: number, height: number) {
      console.log(x, y, width, height);
      this.resizing = false;
    },
  },
});
</script>

<style lang="scss">
.stylebot {
  top: 0;
  left: 0;
  padding: 0;
  color: #000;
  line-height: 20px;
  background: #fff;
  position: fixed !important;
  border: 1px solid #ccc !important;
}

.stylebot-body {
  overflow: auto;
  height: calc(100% - 131px);
}
</style>
