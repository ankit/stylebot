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
    @lostpointercapture="onMoveEnd"
  >
    <slot></slot>

    <div
      v-for="direction in resizeDirections"
      v-show="floating || dockedResizeDirections.includes(direction)"
      :key="`resize-${direction}`"
      class="stylebot-resize-handle"
      :class="direction"
      @pointerdown.stop="onResizeStart($event, direction)"
      @pointermove.stop="onResize"
      @pointerup.stop="onResizeEnd"
      @pointercancel.stop="onResizeEnd"
      @lostpointercapture.stop="onResizeEnd"
    ></div>

    <div
      v-if="!floating"
      key="resize-edge"
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
      @lostpointercapture.stop="onPointerUp"
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

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

type Resize = {
  startX: number;
  startY: number;
  direction: ResizeDirection;
  start: FloatingPanelBounds;
  bounds: FloatingPanelBounds | null;
};

const DOCKED_RESIZE_DIRECTIONS: Array<ResizeDirection> = ['n', 's'];
const RESIZE_DIRECTIONS: Array<ResizeDirection> = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
];

const fit = (value: number, min: number, max: number): number =>
  Math.round(Math.max(min, Math.min(value, max)));

/**
 * Moves the edges a handle grabs by the pointer's offset, stopping at the
 * minimum size and the viewport margin while the opposite edges stay put.
 */
const resizeBounds = (
  start: FloatingPanelBounds,
  direction: ResizeDirection,
  dx: number,
  dy: number
): FloatingPanelBounds => {
  let { left, top } = start;
  let right = left + start.width;
  let bottom = top + start.height;

  if (direction.includes('e')) {
    right = fit(right + dx, left + MIN_WIDTH, window.innerWidth - MARGIN);
  }

  if (direction.includes('w')) {
    left = fit(left + dx, MARGIN, right - MIN_WIDTH);
  }

  if (direction.includes('s')) {
    bottom = fit(bottom + dy, top + MIN_HEIGHT, window.innerHeight - MARGIN);
  }

  if (direction.includes('n')) {
    top = fit(top + dy, MARGIN, bottom - MIN_HEIGHT);
  }

  return { left, top, width: right - left, height: bottom - top };
};

type SnapTarget = 'left' | 'right' | null;

export default Vue.extend({
  name: 'TheStylebotResizer',

  data(): {
    windowWidth: number;
    windowHeight: number;
    drag: Drag | null;
    move: Move | null;
    resize: Resize | null;
    snapTarget: SnapTarget;
  } {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      drag: null,
      move: null,
      resize: null,
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
      return this.drag !== null || this.resize !== null;
    },

    moving(): boolean {
      return Boolean(this.move?.bounds);
    },

    floating(): boolean {
      return (
        this.moving ||
        Boolean(this.resize?.bounds) ||
        this.layout.dockLocation === 'floating'
      );
    },

    floatingBounds(): FloatingPanelBounds {
      const live = this.move?.bounds ?? this.resize?.bounds;
      const saved = this.layout.floating ?? {
        width: this.layout.width,
        height: this.windowHeight - MARGIN * 2,
        left: this.windowWidth - this.layout.width - MARGIN,
        top: MARGIN,
      };

      return this.clampBounds(live ?? saved);
    },

    resizeDirections(): Array<ResizeDirection> {
      return RESIZE_DIRECTIONS;
    },

    dockedResizeDirections(): Array<ResizeDirection> {
      return DOCKED_RESIZE_DIRECTIONS;
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

    onResizeStart(event: PointerEvent, direction: ResizeDirection) {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.$store.commit('setInspecting', false);

      const rect = (this.$refs.panel as HTMLElement).getBoundingClientRect();
      const start = this.floating
        ? this.floatingBounds
        : {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          };

      this.resize = {
        startX: event.clientX,
        startY: event.clientY,
        direction,
        start,
        bounds: null,
      };
    },

    onResize(event: PointerEvent) {
      if (!this.resize) {
        return;
      }

      if (!(event.buttons & 1)) {
        this.onResizeEnd();

        return;
      }

      const { start, startX, startY, direction } = this.resize;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (!this.resize.bounds && Math.hypot(dx, dy) < MOVE_THRESHOLD) {
        return;
      }

      this.resize.bounds = this.clampBounds(
        resizeBounds(start, direction, dx, dy)
      );
    },

    onResizeEnd() {
      if (!this.resize) {
        return;
      }

      const { bounds } = this.resize;
      this.resize = null;

      if (!bounds) {
        return;
      }

      // Shortening a docked panel undocks it, so there's one resizable box to remember.
      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation: 'floating',
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

      if (!(event.buttons & 1)) {
        this.onPointerUp();

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
.stylebot-resize-handle {
  position: absolute;
  touch-action: none;

  &.n,
  &.s {
    right: 14px;
    left: 14px;
    height: 10px;
    cursor: ns-resize;
  }

  &.e,
  &.w {
    top: 14px;
    bottom: 14px;
    width: 10px;
    cursor: ew-resize;
  }

  &.ne,
  &.nw,
  &.se,
  &.sw {
    width: 18px;
    height: 18px;
  }

  &.n,
  &.ne,
  &.nw {
    top: -5px;
  }

  &.s,
  &.se,
  &.sw {
    bottom: -5px;
  }

  &.e,
  &.ne,
  &.se {
    right: -5px;
  }

  &.w,
  &.nw,
  &.sw {
    left: -5px;
  }

  &.ne,
  &.sw {
    cursor: nesw-resize;
  }

  &.nw,
  &.se {
    cursor: nwse-resize;
  }
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
