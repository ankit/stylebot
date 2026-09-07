<template>
  <segmented
    :prev-disabled="widthIndex === 0"
    :next-disabled="widthIndex === WIDTHS.length - 1"
    @prev="pickPrev"
    @next="pickNext"
  >
    <template #prev><span style="font: 400 12px/1 system-ui">&rarr;&larr;</span></template>
    <template #next>
      <span style="font: 400 12px/1 system-ui; display: inline-block; transform: scaleX(2.1)">&harr;</span>
    </template>
  </segmented>
</template>

<script lang="ts">
import Vue from 'vue';

import { WIDTHS, nearestStepIndex } from '@stylebot/readability';

import Segmented from './Segmented.vue';

export default Vue.extend({
  name: 'WidthPicker',

  components: {
    Segmented,
  },

  props: {
    width: {
      type: Number,
      required: true,
    },
  },

  computed: {
    WIDTHS: () => WIDTHS,

    widthIndex(): number {
      return nearestStepIndex(WIDTHS, this.width);
    },
  },

  methods: {
    pickPrev(): void {
      this.$emit('pick', WIDTHS[Math.max(0, this.widthIndex - 1)]);
    },

    pickNext(): void {
      this.$emit('pick', WIDTHS[Math.min(WIDTHS.length - 1, this.widthIndex + 1)]);
    },
  },
});
</script>
