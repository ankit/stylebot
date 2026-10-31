<template>
  <div class="resize-handles" aria-hidden="true">
    <div
      v-for="edge in $options.RESIZE_EDGES"
      :key="edge"
      class="handle"
      :class="edge"
      @pointerdown="$emit('grab', $event, edge)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { RESIZE_EDGES } from '../resize';

/**
 * Invisible handles on the open terminal's edges and corners, each with its
 * resize cursor. Emits `grab` with the press and the edge.
 */
export default Vue.extend({
  name: 'CliResizeHandles',

  RESIZE_EDGES,
});
</script>

<style lang="scss" scoped>
.resize-handles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.handle {
  position: absolute;
  pointer-events: auto;
  touch-action: none;

  &.n,
  &.s {
    right: 12px;
    left: 12px;
    height: 6px;
    cursor: ns-resize;
  }

  &.e,
  &.w {
    top: 12px;
    bottom: 12px;
    width: 6px;
    cursor: ew-resize;
  }

  &.ne,
  &.nw,
  &.se,
  &.sw {
    width: 12px;
    height: 12px;
  }

  &.n,
  &.ne,
  &.nw {
    top: 0;
  }

  &.s,
  &.se,
  &.sw {
    bottom: 0;
  }

  &.e,
  &.ne,
  &.se {
    right: 0;
  }

  &.w,
  &.nw,
  &.sw {
    left: 0;
  }

  &.nw,
  &.se {
    cursor: nwse-resize;
  }

  &.ne,
  &.sw {
    cursor: nesw-resize;
  }
}
</style>
