<template>
  <div
    class="width-edge"
    :class="side"
    role="separator"
    tabindex="0"
    aria-orientation="vertical"
    :aria-label="t('resize_the_panel')"
    :aria-valuenow="width"
    :aria-valuemin="min"
    :aria-valuemax="max"
    @pointerdown.stop="onPointerDown"
    @pointermove.stop="onPointerMove"
    @pointerup.stop="onPointerUp"
    @pointercancel.stop="onPointerUp"
    @lostpointercapture.stop="onPointerUp"
    @dblclick="$emit('reset')"
    @keydown="onKeydown"
  ></div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';

const KEYBOARD_STEP = 16;

type Press = { x: number; width: number };

/**
 * The docked panel's inner edge, which changes its width. Emits the width
 * as it's dragged (preview) and once it's let go (change).
 */
export default Vue.extend({
  name: 'PanelWidthEdge',

  props: {
    width: {
      type: Number,
      required: true,
    },

    min: {
      type: Number,
      required: true,
    },

    max: {
      type: Number,
      required: true,
    },

    // The panel's side the edge sits on, which faces the page.
    side: {
      type: String as PropType<'left' | 'right'>,
      required: true,
    },
  },

  data(): { press: Press | null; latest: number } {
    return { press: null, latest: 0 };
  },

  methods: {
    onPointerDown(event: PointerEvent): void {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.press = { x: event.clientX, width: this.width };
      this.latest = this.width;
      this.$emit('start');
    },

    onPointerMove(event: PointerEvent): void {
      if (!this.press) {
        return;
      }

      if (!(event.buttons & 1)) {
        this.onPointerUp();

        return;
      }

      const delta = event.clientX - this.press.x;
      this.latest = this.press.width + (this.side === 'left' ? -delta : delta);
      this.$emit('preview', this.latest);
    },

    onPointerUp(): void {
      if (!this.press) {
        return;
      }

      this.press = null;
      this.$emit('change', this.latest);
    },

    onKeydown(event: KeyboardEvent): void {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const grows = (event.key === 'ArrowLeft') === (this.side === 'left');
      this.$emit(
        'change',
        this.width + (grows ? KEYBOARD_STEP : -KEYBOARD_STEP)
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.width-edge {
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

  &.left {
    left: -5px;
  }

  &.right {
    right: -5px;
  }
}
</style>
