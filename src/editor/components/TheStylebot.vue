<template>
  <vue-draggable-resizable
    class="stylebot"
    :z="100000000"
    :w="coordinates.width"
    :h="coordinates.height"
    :x="coordinates.x"
    :y="coordinates.y"
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
  </vue-draggable-resizable>
</template>

<script lang="ts">
import Vue from 'vue';

import TheHeader from './TheHeader.vue';
import TheFooter from './TheFooter.vue';

import TheCodeEditor from './TheCodeEditor.vue';
import TheBasicEditor from './TheBasicEditor.vue';
import TheMagicEditor from './TheMagicEditor.vue';

import { StylebotCoordinates, StylebotEditingMode } from '@stylebot/types';

export default Vue.extend({
  name: 'TheStylebot',

  components: {
    TheHeader,
    TheFooter,
    TheBasicEditor,
    TheMagicEditor,
    TheCodeEditor,
  },

  data: () => {
    return {
      dragging: false,
      resizing: false,
    };
  },

  computed: {
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    coordinates(): StylebotCoordinates {
      return this.$store.state.options.coordinates;
    },
  },

  methods: {
    onDragging(x: number, y: number) {
      this.$store.dispatch('setCoordinates', { ...this.coordinates, x, y });
      this.dragging = true;
    },
    onDragStop(x: number, y: number) {
      this.$store.dispatch('setCoordinates', { ...this.coordinates, x, y });
      this.dragging = false;
    },
    onResizing(x: number, y: number, width: number, height: number) {
      this.$store.dispatch('setCoordinates', { x, y, width, height });
      this.resizing = true;
    },
    onResizeStop(x: number, y: number, width: number, height: number) {
      this.$store.dispatch('setCoordinates', { x, y, width, height });
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
