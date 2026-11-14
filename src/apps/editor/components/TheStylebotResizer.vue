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
      floating ? 'floating' : dockedRight ? 'right' : 'left',
      {
        'stylebot-resizing': dragging || moving,
        'stylebot-capturing': capturing,
      },
    ]"
    :style="panelStyle"
    @pointerdown="onMoveStart"
    @pointermove="onMove"
    @pointerup="onMoveEnd"
    @pointercancel="onMoveEnd"
  >
    <slot></slot>

    <div
      v-if="floating"
      class="stylebot-resize-corner"
      :aria-label="t('resize_the_panel')"
      @pointerdown.stop="onCornerDown"
      @pointermove.stop="onCornerMove"
      @pointerup.stop="onCornerUp"
      @pointercancel.stop="onCornerUp"
    ></div>

    <div
      v-else
      class="stylebot-resize-edge"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      :aria-label="t('resize_the_panel')"
      :aria-valuenow="width"
      :aria-valuemin="minWidth"
      :aria-valuemax="maxWidth"
      @pointerdown.stop="onPointerDown"
      @pointermove.stop="onPointerMove"
      @pointerup.stop="onPointerUp"
      @pointercancel.stop="onPointerUp"
      @dblclick="onReset"
      @keydown="onKeydown"
    ></div>

    <div
      v-if="snapTarget"
      class="stylebot-snap-preview"
      :class="snapTarget"
      :style="{ width: `${width}px` }"
    ></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { defaultOptions } from '@stylebot/settings';
import type { FloatingPanelBounds, StylebotLayout } from '@stylebot/types';

const MARGIN = 12;
const MIN_WIDTH = 360;
const MIN_HEIGHT = 280;
const MAX_WIDTH_RATIO = 0.6;
const KEYBOARD_STEP = 16;
const MOVE_THRESHOLD = 4;
const SNAP_DISTANCE = 32;
const HANDLE_IGNORE =
  'button, a, input, select, textarea, [role="button"], [role="menu"], [role="menuitem"], [contenteditable]';

type Drag = { startX: number; startWidth: number; width: number };

type Move = {
  pointerId: number;
  startX: number;
  startY: number;
  start: FloatingPanelBounds;
  bounds: FloatingPanelBounds | null;
};

type CornerDrag = {
  startX: number;
  startY: number;
  start: FloatingPanelBounds;
  bounds: FloatingPanelBounds;
};

type SnapTarget = 'left' | 'right' | null;

export default Vue.extend({
  name: 'TheStylebotResizer',

  data(): {
    windowWidth: number;
    windowHeight: number;
    drag: Drag | null;
    move: Move | null;
    corner: CornerDrag | null;
    snapTarget: SnapTarget;
  } {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      drag: null,
      move: null,
      corner: null,
      snapTarget: null,
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

    dragging(): boolean {
      return this.drag !== null || this.corner !== null;
    },

    moving(): boolean {
      return Boolean(this.move?.bounds);
    },

    floating(): boolean {
      return this.moving || this.layout.dockLocation === 'floating';
    },

    floatingBounds(): FloatingPanelBounds {
      const live = this.move?.bounds ?? this.corner?.bounds;
      const saved = this.layout.floating ?? {
        width: this.layout.width,
        height: this.windowHeight - MARGIN * 2,
        left: this.windowWidth - this.layout.width - MARGIN,
        top: MARGIN,
      };

      return this.clampBounds(live ?? saved);
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

    // In the page only as the side panel's fallback, the panel sits on the right.
    dockedRight(): boolean {
      return this.layout.dockLocation !== 'left';
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

  destroyed() {
    this.adjustPageLayout();
    window.removeEventListener('resize', this.onWindowResize);
  },

  methods: {
    clampBounds(bounds: FloatingPanelBounds): FloatingPanelBounds {
      const fit = (value: number, min: number, max: number) =>
        Math.round(Math.max(min, Math.min(value, max)));

      const maxWidth = this.windowWidth - MARGIN * 2;
      const maxHeight = this.windowHeight - MARGIN * 2;
      const width = fit(bounds.width, Math.min(MIN_WIDTH, maxWidth), maxWidth);
      const height = fit(
        bounds.height,
        Math.min(MIN_HEIGHT, maxHeight),
        maxHeight
      );

      return {
        width,
        height,
        left: fit(bounds.left, MARGIN, this.windowWidth - width - MARGIN),
        top: fit(bounds.top, MARGIN, this.windowHeight - height - MARGIN),
      };
    },

    snapTargetAt(x: number): SnapTarget {
      if (x <= SNAP_DISTANCE) {
        return 'left';
      }

      if (x >= this.windowWidth - SNAP_DISTANCE) {
        return 'right';
      }

      return null;
    },

    /**
     * Starts moving the panel when the header's empty space is pressed;
     * its buttons, menus and fields keep their own clicks.
     */
    onMoveStart(event: PointerEvent) {
      if (event.button !== 0) {
        return;
      }

      const target = event.composedPath()[0] as Element;
      if (
        !(target instanceof Element) ||
        !target.closest('.header-top') ||
        target.closest(HANDLE_IGNORE)
      ) {
        return;
      }

      event.preventDefault();
      const panel = this.$refs.panel as HTMLElement;
      panel.setPointerCapture(event.pointerId);

      const rect = panel.getBoundingClientRect();
      this.move = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        start: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        bounds: null,
      };
    },

    onMove(event: PointerEvent) {
      const { move } = this;
      if (move?.pointerId !== event.pointerId) {
        return;
      }

      if (!(event.buttons & 1)) {
        this.onMoveEnd();

        return;
      }

      const dx = event.clientX - move.startX;
      const dy = event.clientY - move.startY;

      if (!move.bounds) {
        if (Math.hypot(dx, dy) < MOVE_THRESHOLD) {
          return;
        }

        this.$store.commit('setInspecting', false);
      }

      event.preventDefault();
      move.bounds = {
        ...move.start,
        left: move.start.left + dx,
        top: move.start.top + dy,
      };
      this.snapTarget = this.snapTargetAt(event.clientX);
    },

    onMoveEnd() {
      const { move, snapTarget } = this;
      this.move = null;
      this.snapTarget = null;

      if (!move?.bounds) {
        return;
      }

      if (snapTarget) {
        this.$store.dispatch('setLayout', {
          ...this.layout,
          dockLocation: snapTarget,
        });

        return;
      }

      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation: 'floating',
        floating: this.clampBounds(move.bounds),
      });
    },

    onCornerDown(event: PointerEvent) {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.$store.commit('setInspecting', false);

      this.corner = {
        startX: event.clientX,
        startY: event.clientY,
        start: this.floatingBounds,
        bounds: this.floatingBounds,
      };
    },

    onCornerMove(event: PointerEvent) {
      if (!this.corner) {
        return;
      }

      const { start, startX, startY } = this.corner;
      this.corner.bounds = this.clampBounds({
        ...start,
        width: start.width + event.clientX - startX,
        height: start.height + event.clientY - startY,
      });
    },

    onCornerUp() {
      if (!this.corner) {
        return;
      }

      const { bounds } = this.corner;
      this.corner = null;
      this.$store.dispatch('setLayout', {
        ...this.layout,
        floating: bounds,
      });
    },

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
      this.windowHeight = window.innerHeight;
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
      if (this.host !== 'page') {
        return;
      }

      // todo: this needs a lot of work to be more robust.
      if (
        this.layout.adjustPageLayout &&
        this.visible &&
        !this.capturing &&
        !this.floating
      ) {
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

    .header-top {
      cursor: grab;
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

    .header-top {
      cursor: grabbing;
    }

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
    content: '';
  }

  &:focus-visible::after {
    opacity: 1;
  }

  .right > & {
    left: -5px;
  }

  .left > & {
    right: -5px;
  }
}
.stylebot-resize-corner {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  touch-action: none;
}

.stylebot-snap-preview {
  position: fixed;
  top: 12px;
  bottom: 12px;
  z-index: -1;
  background: var(--accent);
  border-radius: 14px;
  opacity: 0.18;
  pointer-events: none;

  &.left {
    left: 12px;
  }

  &.right {
    right: 12px;
  }
}
</style>
