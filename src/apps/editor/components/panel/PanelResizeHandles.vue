<template>
  <div>
    <!-- All kept mounted: moving or remounting a handle mid-drag drops its pointer capture. -->
    <div
      v-for="direction in directions"
      v-show="floating || dockedDirections.includes(direction)"
      :key="direction"
      class="resize-handle"
      :class="direction"
      @pointerdown.stop="onPointerDown($event, direction)"
      @pointermove.stop="onPointerMove"
      @pointerup.stop="onPointerUp"
      @pointercancel.stop="onPointerUp"
      @lostpointercapture.stop="onPointerUp"
    ></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  DOCKED_RESIZE_DIRECTIONS,
  DRAG_THRESHOLD,
  RESIZE_DIRECTIONS,
} from './floating-bounds';
import type { ResizeDirection } from './floating-bounds';

type Press = {
  x: number;
  y: number;
  direction: ResizeDirection;
  resizing: boolean;
};

/**
 * Edge and corner handles that report how far the pointer has dragged them.
 * Docked, the side edges are left to the width edge.
 */
export default Vue.extend({
  name: 'PanelResizeHandles',

  props: {
    floating: {
      type: Boolean,
      required: true,
    },
  },

  data(): { press: Press | null } {
    return { press: null };
  },

  computed: {
    directions(): Array<ResizeDirection> {
      return RESIZE_DIRECTIONS;
    },

    dockedDirections(): Array<ResizeDirection> {
      return DOCKED_RESIZE_DIRECTIONS;
    },
  },

  methods: {
    onPointerDown(event: PointerEvent, direction: ResizeDirection): void {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.press = {
        x: event.clientX,
        y: event.clientY,
        direction,
        resizing: false,
      };
    },

    onPointerMove(event: PointerEvent): void {
      const { press } = this;
      if (!press) {
        return;
      }

      if (!(event.buttons & 1)) {
        this.onPointerUp();

        return;
      }

      const dx = event.clientX - press.x;
      const dy = event.clientY - press.y;

      if (!press.resizing) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
          return;
        }

        press.resizing = true;
        this.$emit('start', press.direction);
      }

      this.$emit('resize', press.direction, dx, dy);
    },

    onPointerUp(): void {
      const { press } = this;
      if (!press) {
        return;
      }

      this.press = null;

      if (press.resizing) {
        this.$emit('end');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.resize-handle {
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
</style>
