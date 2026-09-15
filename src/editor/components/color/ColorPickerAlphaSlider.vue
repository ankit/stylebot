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
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    background: var(--track-background);
  }

  &::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 15px;
    height: 15px;
    margin-top: -2px;
    border-radius: 50%;
    border: 2.5px solid #fff;
    background: var(--thumb-color);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  }

  &::-moz-range-track {
    height: 11px;
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    background: var(--track-background);
  }

  &::-moz-range-thumb {
    width: 15px;
    height: 15px;
    border: 2.5px solid #fff;
    border-radius: 50%;
    background: var(--thumb-color);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
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
  flex: none;
  width: 34px;
  text-align: right;
  font: 400 11.5px/1.2 var(--font-mono);
  color: var(--muted-foreground);
}
</style>
