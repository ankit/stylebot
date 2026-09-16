<template>
  <div
    ref="square"
    class="sv-square"
    :style="{ background: background }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <div class="thumb" :style="{ left: thumbLeft, top: thumbTop, background: color }" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

type SVPayload = { saturation: number; value: number };

export default Vue.extend({
  name: 'ColorPickerSVSquare',

  props: {
    saturation: {
      type: Number,
      required: true,
    },

    value: {
      type: Number,
      required: true,
    },

    hueColor: {
      type: String,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },
  },

  data(): { dragging: boolean } {
    return { dragging: false };
  },

  computed: {
    background(): string {
      return `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${this.hueColor})`;
    },

    thumbLeft(): string {
      return `${this.saturation * 100}%`;
    },

    thumbTop(): string {
      return `${(1 - this.value) * 100}%`;
    },
  },

  methods: {
    onPointerDown(event: PointerEvent): void {
      this.dragging = true;
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
      this.updateFromEvent(event, false);
    },

    onPointerMove(event: PointerEvent): void {
      if (this.dragging) {
        this.updateFromEvent(event, false);
      }
    },

    onPointerUp(event: PointerEvent): void {
      if (!this.dragging) {
        return;
      }

      this.dragging = false;
      this.updateFromEvent(event, true);
    },

    updateFromEvent(event: PointerEvent, final: boolean): void {
      const rect = (this.$refs.square as HTMLElement).getBoundingClientRect();
      const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);

      const payload: SVPayload = {
        saturation: rect.width ? x / rect.width : 0,
        value: rect.height ? 1 - y / rect.height : 0,
      };

      this.$emit(final ? 'change' : 'input', payload);
    },
  },
});
</script>

<style lang="scss" scoped>
.sv-square {
  position: relative;
  height: 132px;
  border-radius: 9px;
  @include picker-track-edge;
  cursor: crosshair;
  touch-action: none;
}

.thumb {
  position: absolute;
  margin: -7.5px 0 0 -7.5px;
  @include picker-thumb(9px);
  pointer-events: none;
}
</style>
