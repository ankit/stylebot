<template>
  <div class="swatches">
    <button
      v-for="themeOption in themeList"
      :key="themeOption.value"
      class="swatch"
      :class="{ selected: themeOption.value === theme }"
      :style="{ background: themeOption.bg }"
      @click="$emit('pick', themeOption.value)"
    />
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

import { ReadabilityTheme } from '@stylebot/types';

import { THEME_BACKGROUNDS } from '../../theme-colors';

export default Vue.extend({
  name: 'ThemePicker',

  props: {
    theme: {
      type: String as PropType<ReadabilityTheme>,
      required: true,
    },
  },

  computed: {
    themeList(): Array<{ value: ReadabilityTheme; label: string; bg: string }> {
      return [
        { value: 'light', label: 'Light', bg: THEME_BACKGROUNDS.light },
        { value: 'sepia', label: 'Sepia', bg: THEME_BACKGROUNDS.sepia },
        { value: 'dark', label: 'Dark', bg: THEME_BACKGROUNDS.dark },
      ];
    },
  },
});
</script>

<style lang="scss" scoped>
.swatches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.swatch {
  all: unset;
  box-sizing: border-box;
  height: 24px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid var(--border);

  &.selected {
    border: 2px solid var(--link-color);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--link-color);
  }
}
</style>
