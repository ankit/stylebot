<template>
  <input
    type="range"
    class="s-slider"
    :min="min"
    :max="max"
    :step="step"
    :value="value"
    :disabled="disabled"
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
});
</script>

<style lang="scss" scoped>
.s-slider {
  flex: 1;
  min-width: 0;
  height: 16px;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: var(--slider-track);
  }

  &::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -6px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }

  &::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: var(--slider-track);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }

  &:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.6;

    &::-webkit-slider-thumb {
      background: var(--text-muted);
      cursor: default;
    }

    &::-moz-range-thumb {
      background: var(--text-muted);
      cursor: default;
    }
  }
}
</style>
