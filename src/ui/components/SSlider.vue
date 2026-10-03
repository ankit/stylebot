<template>
  <input
    type="range"
    class="s-slider"
    :min="min"
    :max="max"
    :step="step"
    :value="value"
    :disabled="disabled"
    :style="{ '--fill': `${fill}%` }"
    @input="$emit('input', $event.target.valueAsNumber)"
  />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SSlider',

  props: {
    value: {
      type: Number,
      required: true,
    },

    min: {
      type: Number,
      default: 0,
    },

    max: {
      type: Number,
      default: 100,
    },

    step: {
      type: Number,
      default: 1,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    fill(): number {
      const span = this.max - this.min;
      const ratio = span > 0 ? (this.value - this.min) / span : 0;
      return Math.min(100, Math.max(0, ratio * 100));
    },
  },
});
</script>

<style lang="scss" scoped>
.s-slider {
  flex: 1;
  min-width: 0;
  height: 12px;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;

  &::-webkit-slider-runnable-track {
    height: 2px;
    border-radius: 1px;
    background: linear-gradient(
      to right,
      var(--text-muted) var(--fill),
      var(--slider-track) var(--fill)
    );
  }

  &::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    margin-top: -5px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 25%), 0 1px 2px rgb(0 0 0 / 30%);
    cursor: grab;
  }

  &::-moz-range-track {
    height: 2px;
    border-radius: 1px;
    background: var(--slider-track);
  }

  &::-moz-range-progress {
    height: 2px;
    border-radius: 1px;
    background: var(--text-muted);
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border: none;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 25%), 0 1px 2px rgb(0 0 0 / 30%);
    cursor: grab;
  }

  @include focus-ring(1px, '::-webkit-slider-thumb');

  &:disabled {
    opacity: 0.6;

    &::-webkit-slider-thumb,
    &::-moz-range-thumb {
      cursor: default;
    }
  }
}
</style>
