<template>
  <div v-if="colors.length" class="recent-row">
    <s-text size="small" variant="muted" as="span" class="heading">
      {{ t('color_picker_recent') }}
    </s-text>
    <div class="swatches">
      <button
        v-for="color in colors"
        :key="color"
        type="button"
        class="swatch"
        :class="{ light: needsHairline(color) }"
        :style="{ background: color }"
        @click="$emit('select', color)"
      >
        <check-icon
          v-if="color === value"
          :size="12"
          class="swatch-check"
          :style="{ color: checkMarkColor(color) }"
        />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { SText } from '@stylebot/components';
import { CheckIcon } from '@stylebot/icons';
import { needsHairline, checkMarkColor } from '../../utils/hsv-color';

export default Vue.extend({
  name: 'ColorPickerRecent',

  components: {
    SText,
    CheckIcon,
  },

  props: {
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
    needsHairline,
    checkMarkColor,
  },
});
</script>

<style lang="scss" scoped>
@import './color-picker-mixins';

.recent-row {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.heading {
  display: block;
}

.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

// Matches the used-colors row above it and the Palette tab's grid — 36px squares.
.swatch {
  @include button-reset;
  width: 36px;
  height: 36px;
  border-radius: 5px;
  @include swatch-states;
}

.swatch-check {
  @include swatch-check;
}
</style>
