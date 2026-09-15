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
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
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
