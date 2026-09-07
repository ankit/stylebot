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

import { SIZES, nearestStepIndex } from '@stylebot/readability';

import Segmented from './Segmented.vue';

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
