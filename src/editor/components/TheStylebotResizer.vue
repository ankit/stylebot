<template>
  <vue-draggable-resizable
    :class="`stylebot ${layout.dockLocation}`"
    class-name-resizing="stylebot-resizing"
    class-name-active="stylebot-resizing-active"
    drag-handle=".stylebot-null"
    :x="x"
    :w="width"
    :h="height"
    :z="100000000"
    :min-width="300"
    :active="resizing"
    :draggable="false"
    :prevent-deactivation="true"
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

import { StylebotLayout, StylebotEditingMode } from '@stylebot/types';

export default Vue.extend({
  name: 'TheStylebotResizer',

  data: () => {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    };
  },

  computed: {
    resizing(): boolean {
      return this.$store.state.resizing;
    },

    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    layout(): StylebotLayout {
      return this.$store.state.options.layout;
    },

    visible(): boolean {
      return this.$store.state.visible;
    },

    dockedRight(): boolean {
      if (this.layout.dockLocation === 'right') {
        return true;
      }

      return false;
    },

    width(): number {
      return this.layout.width;
    },

    height(): number {
      return this.windowHeight;
    },

    x(): number {
      if (this.dockedRight) {
        return this.windowWidth - this.width - 15;
      }

      return 0;
    },

    handles(): Array<'ml' | 'mr'> {
      return this.dockedRight ? ['ml'] : ['mr'];
    },
  },

  watch: {
    layout() {
      this.adjustPageLayout();
    },
  },

  created() {
    window.addEventListener('resize', this.onWindowResize);
  },

  destroyed() {
    this.adjustPageLayout();
    window.removeEventListener('resize', this.onWindowResize);
  },

  methods: {
    onWindowResize() {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
      this.adjustPageLayout();
    },

    onActivated() {
      this.$store.commit('setInspecting', false);
    },

    onResizing(x: number, y: number, width: number) {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        width,
      });
    },

    onResizeStop(x: number, y: number, width: number) {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        width,
      });
    },

    adjustPageLayout() {
      // todo: this needs a lot of work to be more robust.
      if (this.layout.adjustPageLayout && this.visible) {
        if (this.layout.dockLocation === 'left') {
          document.body.style.width = ``;
          document.body.style.marginLeft = `${this.layout.width}px`;
        } else {
          document.body.style.marginLeft = ``;
          document.body.style.width = `calc(100% - ${this.layout.width}px)`;
        }
      } else {
        document.body.style.width = ``;
        document.body.style.marginLeft = ``;
      }
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

    &.left {
      left: 0;
    }
  }
}
</style>
