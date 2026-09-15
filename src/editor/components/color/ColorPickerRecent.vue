<template>
  <div v-if="colors.length" class="recent-row">
    <s-text size="small" variant="muted" as="span" class="label">{{ t('color_picker_recent') }}</s-text>
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
        <check-icon v-if="color === value" :size="10" class="swatch-check" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { SText } from '@stylebot/components';
import { CheckIcon } from '@stylebot/icons';
import { needsHairline } from '../../utils/hsv-color';

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
  },
});
</script>

<style lang="scss" scoped>
.recent-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label {
  flex: none;
}

.swatches {
  display: flex;
  gap: 4px;
}

.swatch {
  @include button-reset;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  @include swatch-states;
}

.swatch-check {
  @include swatch-check;
}
</style>
