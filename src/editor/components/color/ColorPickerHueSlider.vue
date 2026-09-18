<template>
  <div class="hue-slider-row">
    <input
      type="range"
      class="range"
      min="0"
      max="359"
      step="1"
      :value="hue"
      :style="{ '--thumb-color': thumbColor }"
      @input="$emit('input', $event.target.valueAsNumber)"
      @change="$emit('change', $event.target.valueAsNumber)"
    />
    <div class="readout">{{ Math.round(hue) }}°</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ColorPickerHueSlider',

  props: {
    hue: {
      type: Number,
      required: true,
    },
  },

  computed: {
    thumbColor(): string {
      return `hsl(${this.hue}, 100%, 50%)`;
    },
  },
});
</script>

<style lang="scss" scoped>
@import './color-picker-mixins';

.hue-slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range {
  flex: 1;
  min-width: 0;
  height: 20px;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: 11px;
    border-radius: 6px;
    @include picker-track-edge;
    background: linear-gradient(
      to right,
      #ff0000,
      #ffff00,
      #00ff00,
      #00ffff,
      #0000ff,
      #ff00ff,
      #ff0000
    );
  }

  &::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    margin-top: -2px;
    @include picker-thumb;
    background: var(--thumb-color);
  }

  &::-moz-range-track {
    height: 11px;
    border-radius: 6px;
    @include picker-track-edge;
    background: linear-gradient(
      to right,
      #ff0000,
      #ffff00,
      #00ff00,
      #00ffff,
      #0000ff,
      #ff00ff,
      #ff0000
    );
  }

  &::-moz-range-thumb {
    @include picker-thumb;
    background: var(--thumb-color);
  }

  &:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }

  &:focus-visible::-moz-range-thumb {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
}

.readout {
  @include picker-readout;
}
</style>
