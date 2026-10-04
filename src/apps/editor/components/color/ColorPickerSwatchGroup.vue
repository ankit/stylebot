<template>
  <section class="swatch-group">
    <div class="label">
      <span>{{ label }}</span>
      <slot name="label-action" />
    </div>

    <!-- Ends the preview on leaving the grid, not each swatch, so sweeping across the gaps doesn't flash the page's color. -->
    <div class="swatches" @mouseleave="$emit('preview-end')">
      <color-picker-swatch
        v-for="(color, index) in colors"
        :key="`${index}-${color}`"
        :color="color"
        :selected="sameColor(color, value)"
        @select="$emit('select', $event)"
        @preview="$emit('preview', $event)"
        @preview-end="$emit('preview-end')"
      />
      <slot />
    </div>
  </section>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import ColorPickerSwatch from './ColorPickerSwatch.vue';
import { sameColor } from '../../utils/hsv-color';

export default Vue.extend({
  name: 'ColorPickerSwatchGroup',

  components: {
    ColorPickerSwatch,
  },

  props: {
    label: {
      type: String,
      required: true,
    },

    colors: {
      type: Array as PropType<Array<string>>,
      required: true,
    },

    value: {
      type: String,
      default: '',
    },
  },

  methods: {
    sameColor,
  },
});
</script>

<style lang="scss" scoped>
@import './color-picker-mixins';

.swatch-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  @include section-label;

  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 12px;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
}
</style>
