<template>
  <div class="first-tab">
    <div v-if="usedColors.length" class="used-colors">
      <button
        v-for="color in usedColors"
        :key="color"
        type="button"
        class="swatch"
        :class="{ light: needsHairline(color) }"
        :style="{ background: color }"
        @click="$emit('select', color)"
      >
        <check-icon v-if="color === value" :size="12" class="swatch-check" />
      </button>
    </div>

    <s-text v-else-if="!recentColors.length" size="small" variant="muted">
      {{ t('color_picker_already_used_empty') }}
    </s-text>

    <div v-if="recentColors.length" class="recent-section">
      <color-picker-recent :colors="recentColors" :value="value" @select="$emit('select', $event)" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { SText } from '@stylebot/components';
import { CheckIcon } from '@stylebot/icons';
import { RoleColorGroups } from '@stylebot/css';
import ColorPickerRecent from './ColorPickerRecent.vue';
import { needsHairline } from '../../utils/hsv-color';

export default Vue.extend({
  name: 'ColorPickerFirstTab',

  components: {
    SText,
    CheckIcon,
    ColorPickerRecent,
  },

  props: {
    colors: {
      type: Object as PropType<RoleColorGroups>,
      required: true,
    },

    recentColors: {
      type: Array as PropType<Array<string>>,
      default: () => [],
    },

    value: {
      type: String,
      default: '',
    },
  },

  computed: {
    // Text and surface colors are just different CSS properties on the same
    // site — splitting them into separate rows added structure without
    // adding information, so they're deduped into one flat row.
    usedColors(): Array<string> {
      return Array.from(new Set([...this.colors.text, ...this.colors.surface]));
    },
  },

  methods: {
    needsHairline,
  },
});
</script>

<style lang="scss" scoped>
.first-tab {
  padding: 12px 14px;
}

.used-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

// Matches the Palette tab's grid swatches exactly (316px inner width,
// repeat(8, 1fr), 4px gaps → 36px) so every tab reads as the same surface.
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

.recent-section {
  margin-top: 12px;
}
</style>
