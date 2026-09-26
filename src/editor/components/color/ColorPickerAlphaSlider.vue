<template>
  <div class="alpha-slider-row">
    <input
      type="range"
      class="range"
      min="0"
      max="100"
      step="1"
      :value="Math.round(alpha * 100)"
      :style="{ '--track-background': trackBackground, '--thumb-color': color }"
      @input="$emit('input', $event.target.valueAsNumber / 100)"
      @change="$emit('change', $event.target.valueAsNumber / 100)"
    />
    <div class="readout">{{ Math.round(alpha * 100) }}%</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import tinycolor from 'tinycolor2';

export default Vue.extend({
  name: 'ColorPickerAlphaSlider',

  props: {
    alpha: {
      type: Number,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },
  },

  computed: {
    trackBackground(): string {
      const { r, g, b } = tinycolor(this.color).toRgb();
      return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), ${this.color}), repeating-conic-gradient(#e6e8ed 0% 25%, #fff 0% 50%) 0 / 10px 10px`;
    },
  },
});
</script>

<style lang="scss" scoped>
@import './color-picker-mixins';

.alpha-slider-row {
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
    background: var(--track-background);
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
    background: var(--track-background);
  }

  &::-moz-range-thumb {
    @include picker-thumb;
    background: var(--thumb-color);
  }

  &:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  &:focus-visible::-moz-range-thumb {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
}

.readout {
  @include picker-readout;
}
</style>
