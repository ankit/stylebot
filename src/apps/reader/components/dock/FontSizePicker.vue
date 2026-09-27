<template>
  <segmented
    :prev-disabled="sizeIndex === 0"
    :next-disabled="sizeIndex === SIZES.length - 1"
    @prev="pickPrev"
    @next="pickNext"
  >
    <template #prev><span style="font: 400 11px/1 system-ui">A</span></template>
    <template #next><span style="font: 400 17px/1 system-ui">A</span></template>
  </segmented>
</template>

<script lang="ts">
import Vue from 'vue';

import { nearestStepIndex } from './utils/nearest-step-index';

import Segmented from './Segmented.vue';

// Discrete font-size steps for the segmented +/- control.
// 16 is the default; two steps sit below it so "smaller" isn't disabled.
const SIZES = [14, 15, 16, 17, 18, 19, 21, 23, 25];

export default Vue.extend({
  name: 'FontSizePicker',

  components: {
    Segmented,
  },

  props: {
    size: {
      type: Number,
      required: true,
    },
  },

  computed: {
    SIZES: () => SIZES,

    sizeIndex(): number {
      return nearestStepIndex(SIZES, this.size);
    },
  },

  methods: {
    pickPrev(): void {
      this.$emit('pick', SIZES[Math.max(0, this.sizeIndex - 1)]);
    },

    pickNext(): void {
      this.$emit('pick', SIZES[Math.min(SIZES.length - 1, this.sizeIndex + 1)]);
    },
  },
});
</script>
