<template>
  <button
    type="button"
    class="swatch"
    :class="{ light: needsHairline(color) }"
    :style="{ background: color }"
    @click="$emit('select', color)"
  >
    <check-icon
      v-if="selected"
      :size="14"
      class="swatch-check"
      :style="{ color: checkMarkColor(color) }"
    />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { CheckIcon } from '@stylebot/icons';
import { needsHairline, checkMarkColor } from '../../utils/hsv-color';

export default Vue.extend({
  name: 'ColorPickerSwatch',

  components: {
    CheckIcon,
  },

  props: {
    color: {
      type: String,
      required: true,
    },

    selected: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    needsHairline,
    checkMarkColor,
  },
});
</script>

<style lang="scss" scoped>
@import './color-picker-mixins';

.swatch {
  @include button-reset;

  aspect-ratio: 1;
  border-radius: 5px;
  @include swatch-states;
}

.swatch-check {
  @include swatch-check;
}
</style>
