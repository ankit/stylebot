<template>
  <vue-draggable-resizable
    :class="`stylebot ${coordinates.dockLocation}`"
    class-name-resizing="stylebot-resizing"
    class-name-active="stylebot-resizing-active"
    drag-handle=".resize-action"
    :x="x"
    :w="width"
    :h="height"
    :z="100000000"
    :min-width="300"
    :draggable="false"
    :handles="handles"
    @resizing="onResizing"
    @activated="onActivated"
    @resizestop="onResizeStop"
  >
    <slot></slot>
  </vue-draggable-resizable>
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotCoordinates, StylebotEditingMode } from '@stylebot/types';

export default Vue.extend({
  name: 'TheStylebotResizer',

  data: () => {
    return {
      resizing: false,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    };
  },

  computed: {
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    coordinates(): StylebotCoordinates {
      return this.$store.state.options.coordinates;
    },

    dockedRight(): boolean {
      if (this.coordinates.dockLocation === 'right') {
        return true;
      }

      return false;
    },

    width(): number {
      return this.coordinates.width;
    },

    height(): number {
      return this.windowHeight;
    },

    x(): number {
      if (this.dockedRight) {
        return this.windowWidth - this.width - 23;
      }

      return -10;
    },

    handles(): Array<'ml' | 'mr'> {
      return this.dockedRight ? ['ml'] : ['mr'];
    },
  },

  created() {
    window.addEventListener('resize', this.onWindowResize);
  },

  destroyed() {
    window.removeEventListener('resize', this.onWindowResize);
  },

  methods: {
    onWindowResize() {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
    },

    onActivated() {
      this.$store.commit('setInspecting', false);
    },

    onResizing(x: number, y: number, width: number) {
      this.$store.dispatch('setCoordinates', {
        ...this.coordinates,
        width,
      });

      this.resizing = true;
    },

    onResizeStop(x: number, y: number, width: number) {
      this.$store.dispatch('setCoordinates', {
        ...this.coordinates,
        width,
      });

      this.resizing = false;
    },
  },
});
</script>

<style lang="scss">
.stylebot {
  &.vdr {
    position: fixed;
    border: 1px solid #ccc;

    &.stylebot-resizing,
    &.stylebot-resizing-active {
      border: 5px solid #0062cc;
    }

    .handle {
      width: 20px;
      height: 20px;
      background: #0062cc;
      border: none;
    }

    .handle-ml {
      left: -20px;
    }

    .handle-mr {
      right: -20px;
    }
  }
}
</style>
