<template>
  <div
    v-if="host !== 'page'"
    class="stylebot stylebot-window"
    :class="{ 'stylebot-sidepanel': host === 'sidepanel' }"
  >
    <slot></slot>
  </div>

  <div
    v-else
    ref="panel"
    class="stylebot stylebot-docked"
    :class="[
      placement,
      { 'stylebot-resizing': busy, 'stylebot-capturing': capturing },
    ]"
    :style="panelStyle"
  >
    <slot></slot>

    <panel-resize-handles
      :floating="floating"
      @start="onResizeStart"
      @resize="onResize"
      @end="onResizeEnd"
    />

    <panel-width-edge
      v-if="!floating"
      :width="width"
      :min="minWidth"
      :max="maxWidth"
      :side="placement === 'right' ? 'left' : 'right'"
      @start="onWidthStart"
      @preview="previewWidth = $event"
      @change="saveWidth"
      @reset="saveWidth(defaultWidth)"
    />

    <div
      v-if="snap"
      class="stylebot-snap-preview"
      :class="[snap.side, { armed: snap.armed }]"
      :style="{ width: `${width}px` }"
    ></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { defaultOptions } from '@stylebot/settings';
import type { FloatingPanelBounds, StylebotLayout } from '@stylebot/types';

import PanelResizeHandles from './panel/PanelResizeHandles.vue';
import PanelWidthEdge from './panel/PanelWidthEdge.vue';
import { HeaderDrag } from './panel/header-drag';
import { reservePageSpace } from './panel/page-layout';
import {
  MARGIN,
  MIN_WIDTH,
  boundsOf,
  defaultFloatingBounds,
  fitBounds,
  resizeBounds,
  snapFor,
} from './panel/floating-bounds';
import type { ResizeDirection, Snap, Viewport } from './panel/floating-bounds';

const MAX_WIDTH_RATIO = 0.6;

type Gesture = {
  start: FloatingPanelBounds;
  bounds: FloatingPanelBounds | null;
};

export default Vue.extend({
  name: 'TheStylebotResizer',

  components: {
    PanelResizeHandles,
    PanelWidthEdge,
  },

  data(): {
    viewport: Viewport;
    previewWidth: number | null;
    gesture: Gesture | null;
    snap: Snap | null;
    headerDrag: HeaderDrag | null;
  } {
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      previewWidth: null,
      gesture: null,
      snap: null,
      headerDrag: null,
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

    capturing(): boolean {
      return this.$store.state.capturing;
    },

    busy(): boolean {
      return this.previewWidth !== null || this.gesture !== null;
    },

    floating(): boolean {
      return (
        Boolean(this.gesture?.bounds) || this.layout.dockLocation === 'floating'
      );
    },

    // In the page only as the side panel's fallback, the panel sits on the right.
    placement(): 'floating' | 'left' | 'right' {
      if (this.floating) {
        return 'floating';
      }

      return this.layout.dockLocation === 'left' ? 'left' : 'right';
    },

    floatingBounds(): FloatingPanelBounds {
      const bounds =
        this.gesture?.bounds ??
        this.layout.floating ??
        defaultFloatingBounds(this.layout.width, this.viewport);

      return fitBounds(bounds, this.viewport);
    },

    panelStyle(): Record<string, string> {
      if (!this.floating) {
        return { width: `${this.width}px` };
      }

      const { left, top, width, height } = this.floatingBounds;

      return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      };
    },

    defaultWidth(): number {
      return defaultOptions.layout.width;
    },

    minWidth(): number {
      return MIN_WIDTH;
    },

    maxWidth(): number {
      return Math.max(
        MIN_WIDTH,
        Math.round(this.viewport.width * MAX_WIDTH_RATIO)
      );
    },

    width(): number {
      return this.clampWidth(this.previewWidth ?? this.layout.width);
    },
  },

  watch: {
    layout() {
      this.adjustPageLayout();
    },

    floating() {
      this.adjustPageLayout();
    },

    width() {
      this.adjustPageLayout();
    },

    capturing() {
      this.adjustPageLayout();
    },
  },

  created() {
    this.adjustPageLayout();
    window.addEventListener('resize', this.onWindowResize);
  },

  mounted() {
    const panel = this.$refs.panel as HTMLElement | undefined;

    if (panel) {
      this.headerDrag = new HeaderDrag(panel, {
        start: this.onMoveStart,
        move: this.onMove,
        end: this.onMoveEnd,
      });
    }
  },

  destroyed() {
    this.adjustPageLayout();
    window.removeEventListener('resize', this.onWindowResize);
    this.headerDrag?.destroy();
  },

  methods: {
    /**
     * Starts a move or resize from where the panel is on screen, docked or not.
     */
    beginGesture(): void {
      this.$store.commit('setInspecting', false);
      this.gesture = {
        start: boundsOf(this.$refs.panel as HTMLElement),
        bounds: null,
      };
    },

    saveFloating(bounds: FloatingPanelBounds): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation: 'floating',
        floating: fitBounds(bounds, this.viewport),
      });
    },

    onMoveStart(): void {
      this.beginGesture();
    },

    onMove(dx: number, dy: number, x: number): void {
      if (!this.gesture) {
        return;
      }

      const { start } = this.gesture;
      this.gesture.bounds = {
        ...start,
        left: start.left + dx,
        top: start.top + dy,
      };
      this.snap = snapFor(this.gesture.bounds, x, this.viewport);
    },

    onMoveEnd(dragged: boolean): void {
      const { gesture, snap } = this;
      this.gesture = null;
      this.snap = null;

      if (!dragged || !gesture?.bounds) {
        return;
      }

      if (snap?.armed) {
        this.$store.dispatch('setLayout', {
          ...this.layout,
          dockLocation: snap.side,
        });

        return;
      }

      this.saveFloating(gesture.bounds);
    },

    onResizeStart(): void {
      this.beginGesture();
    },

    onResize(direction: ResizeDirection, dx: number, dy: number): void {
      if (!this.gesture) {
        return;
      }

      this.gesture.bounds = fitBounds(
        resizeBounds(this.gesture.start, direction, dx, dy, this.viewport),
        this.viewport
      );
    },

    // Shortening a docked panel undocks it, so there's one resizable box to remember.
    onResizeEnd(): void {
      const bounds = this.gesture?.bounds;
      this.gesture = null;

      if (bounds) {
        this.saveFloating(bounds);
      }
    },

    onWidthStart(): void {
      this.$store.commit('setInspecting', false);
    },

    clampWidth(width: number): number {
      return Math.min(Math.max(Math.round(width), MIN_WIDTH), this.maxWidth);
    },

    saveWidth(width: number): void {
      this.previewWidth = null;
      this.$store.dispatch('setLayout', {
        ...this.layout,
        width: this.clampWidth(width),
      });
    },

    onWindowResize(): void {
      this.viewport = { width: window.innerWidth, height: window.innerHeight };
      this.adjustPageLayout();
    },

    adjustPageLayout(): void {
      if (this.host !== 'page') {
        return;
      }

      // todo: this needs a lot of work to be more robust.
      const reserve =
        this.layout.adjustPageLayout &&
        this.visible &&
        !this.capturing &&
        !this.floating;

      reservePageSpace(
        reserve ? (this.placement as 'left' | 'right') : null,
        this.width + MARGIN
      );
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

  &.stylebot-sidepanel {
    --panel-gutter: 10px;
  }

  &.stylebot-docked {
    position: fixed;
    box-sizing: border-box;
    top: 12px;
    bottom: 12px;
    z-index: 100000000;
    border: 1px solid var(--panel-border);
    border-radius: 14px;
    box-shadow: 0 14px 40px var(--panel-shadow);
    transition: transform 0.22s ease;

    &.left {
      left: 12px;
    }

    &.right {
      right: 12px;
    }

    &.floating {
      right: auto;
      bottom: auto;
      transition: opacity 0.22s ease;
    }

    .stylebot-drag-handle {
      cursor: grab;

      input,
      textarea {
        cursor: text;
      }
    }
  }

  &.stylebot-capturing {
    &.floating {
      pointer-events: none;
      opacity: 0;
    }

    &.right {
      transform: translateX(calc(100% + 64px));
    }

    &.left {
      transform: translateX(calc(-100% - 64px));
    }
  }

  &.stylebot-resizing {
    user-select: none;

    .stylebot-drag-handle {
      cursor: grabbing;
    }

    .stylebot-content {
      pointer-events: none;
    }
  }
}

.stylebot-snap-preview {
  position: fixed;
  top: 12px;
  bottom: 12px;
  z-index: -1;
  background: var(--accent);
  border-radius: 14px;
  opacity: 0.06;
  pointer-events: none;
  transition: opacity 0.12s ease;

  &.armed {
    opacity: 0.2;
  }

  &.left {
    left: 12px;
  }

  &.right {
    right: 12px;
  }
}
</style>
