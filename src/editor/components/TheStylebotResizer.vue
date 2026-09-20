<template>
  <div v-if="host === 'window'" class="stylebot stylebot-window">
    <slot></slot>
  </div>

  <vue-draggable-resizable
    v-else
    :class="`stylebot ${layout.dockLocation}`"
    class-name-resizing="stylebot-resizing"
    class-name-active="stylebot-resizing-active"
    drag-handle=".stylebot-null"
    :x="x"
    :y="margin"
    :w="width"
    :h="height"
    :z="100000000"
    :min-width="minWidth"
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

import type { StylebotLayout, StylebotEditingMode } from '@stylebot/types';

const MARGIN = 12;
const MIN_WIDTH = 340;

export default Vue.extend({
  name: 'TheStylebotResizer',

  data: () => {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    };
  },

  computed: {
    host(): string {
      return this.$store.state.host;
    },

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

    minWidth(): number {
      return MIN_WIDTH;
    },

    width(): number {
      // Guards against a width persisted before MIN_WIDTH was raised.
      return Math.max(this.layout.width, MIN_WIDTH);
    },

    height(): number {
      return this.windowHeight - MARGIN * 2;
    },

    margin(): number {
      return MARGIN;
    },

    x(): number {
      if (this.dockedRight) {
        return this.windowWidth - this.width - MARGIN;
      }

      return MARGIN;
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
    this.adjustPageLayout();
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
      if (this.host === 'window') {
        return;
      }

      // todo: this needs a lot of work to be more robust.
      if (this.layout.adjustPageLayout && this.visible) {
        const reserved = this.width + MARGIN;

        if (this.layout.dockLocation === 'left') {
          document.body.style.width = ``;
          document.body.style.marginRight = ``;
          document.body.style.marginLeft = `${reserved}px`;
        } else {
          document.body.style.marginLeft = ``;
          // An RTL page resolves the over-constrained body from its right
          // edge, so the explicit margin (not just the width) keeps the gap on the right.
          document.body.style.marginRight = `${reserved}px`;
          document.body.style.width = `calc(100% - ${reserved}px)`;
        }
      } else {
        document.body.style.width = ``;
        document.body.style.marginLeft = ``;
        document.body.style.marginRight = ``;
      }
    },
  },
});
</script>

<style lang="scss">
.stylebot {
  &.stylebot-window {
    position: absolute;
    inset: 0;
  }

  &.vdr {
    position: fixed;
    border: 1px solid var(--panel-border);
    border-radius: 14px;
    box-shadow: 0 14px 40px var(--panel-shadow);

    &.stylebot-resizing,
    &.stylebot-resizing-active {
      border: 5px solid var(--accent);
    }

    .handle {
      width: 20px;
      height: 20px;
      background: var(--accent);
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
