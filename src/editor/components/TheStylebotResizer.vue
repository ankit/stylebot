<template>
  <div v-if="host === 'window'" class="stylebot stylebot-window">
    <slot></slot>
  </div>

  <div
    v-else
    class="stylebot stylebot-docked"
    :class="[layout.dockLocation, { 'stylebot-resizing': dragging }]"
    :style="{ width: `${width}px` }"
  >
    <slot></slot>

    <div
      class="stylebot-resize-edge"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      :aria-label="t('resize_the_panel')"
      :aria-valuenow="width"
      :aria-valuemin="minWidth"
      :aria-valuemax="maxWidth"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @dblclick="onReset"
      @keydown="onKeydown"
    ></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { defaultOptions } from '@stylebot/settings';
import type { StylebotLayout } from '@stylebot/types';

const MARGIN = 12;
const MIN_WIDTH = 340;
const MAX_WIDTH_RATIO = 0.6;
const KEYBOARD_STEP = 16;

type Drag = { startX: number; startWidth: number; width: number };

export default Vue.extend({
  name: 'TheStylebotResizer',

  data(): { windowWidth: number; drag: Drag | null } {
    return {
      windowWidth: window.innerWidth,
      drag: null,
    };
  },

  computed: {
    host(): string {
      return this.$store.state.host;
    },

    layout(): StylebotLayout {
      return this.$store.state.options.layout;
    },

    visible(): boolean {
      return this.$store.state.visible;
    },

    dragging(): boolean {
      return this.drag !== null;
    },

    dockedRight(): boolean {
      return this.layout.dockLocation === 'right';
    },

    minWidth(): number {
      return MIN_WIDTH;
    },

    maxWidth(): number {
      return Math.max(
        MIN_WIDTH,
        Math.round(this.windowWidth * MAX_WIDTH_RATIO)
      );
    },

    width(): number {
      return this.clamp(this.drag ? this.drag.width : this.layout.width);
    },
  },

  watch: {
    layout() {
      this.adjustPageLayout();
    },

    width() {
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
    clamp(width: number): number {
      return Math.min(Math.max(Math.round(width), MIN_WIDTH), this.maxWidth);
    },

    saveWidth(width: number): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        width: this.clamp(width),
      });
    },

    onWindowResize() {
      this.windowWidth = window.innerWidth;
      this.adjustPageLayout();
    },

    onPointerDown(event: PointerEvent) {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.$store.commit('setInspecting', false);

      this.drag = {
        startX: event.clientX,
        startWidth: this.width,
        width: this.width,
      };
    },

    onPointerMove(event: PointerEvent) {
      if (!this.drag) {
        return;
      }

      const delta = event.clientX - this.drag.startX;
      this.drag.width =
        this.drag.startWidth + (this.dockedRight ? -delta : delta);
    },

    onPointerUp() {
      if (!this.drag) {
        return;
      }

      const { width } = this.drag;
      this.drag = null;
      this.saveWidth(width);
    },

    onReset() {
      this.saveWidth(defaultOptions.layout.width);
    },

    onKeydown(event: KeyboardEvent) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const grows = (event.key === 'ArrowLeft') === this.dockedRight;
      this.saveWidth(this.width + (grows ? KEYBOARD_STEP : -KEYBOARD_STEP));
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
          document.body.style.marginLeft = `${reserved}px`;
        } else {
          document.body.style.marginLeft = ``;
          document.body.style.width = `calc(100% - ${reserved}px)`;
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
  &.stylebot-window {
    position: absolute;
    inset: 0;
  }

  &.stylebot-docked {
    position: fixed;
    top: 12px;
    bottom: 12px;
    z-index: 100000000;
    border: 1px solid var(--panel-border);
    border-radius: 14px;
    box-shadow: 0 14px 40px var(--panel-shadow);

    &.left {
      left: 12px;
    }

    &.right {
      right: 12px;
    }
  }

  &.stylebot-resizing {
    user-select: none;

    .stylebot-content {
      pointer-events: none;
    }
  }
}

.stylebot-resize-edge {
  position: absolute;
  top: 14px;
  bottom: 14px;
  width: 8px;
  cursor: col-resize;
  touch-action: none;
  outline: none;

  &::after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 3px;
    width: 2px;
    background: var(--accent);
    border-radius: 1px;
    opacity: 0;
    transition: opacity 0.15s;
    content: '';
  }

  &:hover::after,
  &:focus-visible::after,
  .stylebot-resizing > &::after {
    opacity: 1;
  }

  .right > & {
    left: -5px;
  }

  .left > & {
    right: -5px;
  }
}
</style>
