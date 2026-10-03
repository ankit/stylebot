<template>
  <color-picker-swatch-group
    class="palette"
    :label="t('palette')"
    :colors="activeColors"
    :value="value"
    @select="$emit('select', $event)"
  >
    <template #label-action>
      <s-anchored-menu class="palette-menu-anchor">
        <template #trigger="{ toggle, open }">
          <button
            type="button"
            class="palette-trigger"
            :class="{ open }"
            aria-haspopup="menu"
            :aria-expanded="open ? 'true' : 'false'"
            @click="toggle"
          >
            {{ activeLabel }}
            <chevron-down-icon :size="12" class="palette-chevron" />
          </button>
        </template>

        <template #default="{ close }">
          <s-menu dense :min-width="190" :max-height="260">
            <s-menu-item
              v-for="option in options"
              :key="option.key"
              :selected="option.key === activeKey"
              role="menuitemradio"
              :aria-checked="option.key === activeKey ? 'true' : 'false'"
              @click="
                selectOption(option.key);
                close();
              "
            >
              <span class="option-row">
                <span class="option-bars">
                  <span
                    v-for="(color, index) in option.preview"
                    :key="index"
                    class="option-bar"
                    :style="{ background: color }"
                  />
                </span>
                <span class="option-name">{{ option.label }}</span>
              </span>
            </s-menu-item>
          </s-menu>
        </template>
      </s-anchored-menu>
    </template>
  </color-picker-swatch-group>
</template>

<script lang="ts">
import Vue from 'vue';
import { SAnchoredMenu, SMenu, SMenuItem } from '@stylebot/components';
import { ChevronDownIcon } from '@stylebot/icons';

import ColorPickerSwatchGroup from './ColorPickerSwatchGroup.vue';
import { colorSchemes } from '../../utils/color-schemes';
import {
  neutralRamps,
  hueGrid,
  readingRow,
  darkModeRow,
} from '../../utils/color-sets';

type PaletteOption = {
  key: string;
  label: string;
  preview: Array<string>;
  colors: Array<string>;
};

const SET_OPTIONS: Array<Omit<PaletteOption, 'label'> & { labelKey: string }> =
  [
    {
      key: 'neutrals',
      labelKey: 'color_picker_set_neutrals',
      preview: neutralRamps[0].slice(0, 6),
      colors: neutralRamps.flat(),
    },
    {
      key: 'hues',
      labelKey: 'color_picker_set_hues',
      preview: hueGrid[2].slice(0, 6),
      colors: hueGrid.flat(),
    },
    {
      key: 'reading',
      labelKey: 'color_picker_set_reading',
      preview: readingRow.slice(0, 6),
      colors: readingRow,
    },
    {
      key: 'dark-mode',
      labelKey: 'color_picker_set_dark_mode',
      preview: darkModeRow.slice(0, 6),
      colors: darkModeRow,
    },
  ];

const SCHEME_OPTIONS: Array<PaletteOption> = colorSchemes.map(scheme => ({
  key: scheme.name,
  label: scheme.name,
  preview: scheme.colors.slice(0, 6),
  colors: scheme.colors,
}));

export default Vue.extend({
  name: 'ColorPickerPalette',

  components: {
    SAnchoredMenu,
    SMenu,
    SMenuItem,
    ChevronDownIcon,
    ColorPickerSwatchGroup,
  },

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  data(): { activeKey: string } {
    return {
      activeKey: this.$store.state.options.lastColorSet,
    };
  },

  computed: {
    options(): Array<PaletteOption> {
      return [
        ...SET_OPTIONS.map(({ labelKey, ...option }) => ({
          ...option,
          label: this.t(labelKey),
        })),
        ...SCHEME_OPTIONS,
      ];
    },

    activeOption(): PaletteOption {
      return (
        this.options.find(option => option.key === this.activeKey) ??
        this.options[0]
      );
    },

    activeLabel(): string {
      return this.activeOption.label;
    },

    activeColors(): Array<string> {
      return this.activeOption.colors;
    },
  },

  methods: {
    selectOption(key: string): void {
      this.activeKey = key;
      this.$store.dispatch('setLastColorSet', key);
    },
  },
});
</script>

<style lang="scss" scoped>
.palette-trigger {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 4px;
  margin: -3px -2px -3px -6px;
  padding: 3px 2px 3px 6px;
  border-radius: 5px;
  color: var(--text-body);
  cursor: pointer;

  &:hover,
  &.open {
    background: var(--field-surface-hover);
  }

  @include focus-ring;
}

.palette-chevron {
  color: var(--text-faint);

  .open & {
    transform: rotate(180deg);
  }
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.option-bars {
  flex: none;
  display: flex;
  gap: 2px;
}

.option-bar {
  width: 8px;
  height: 14px;
  border-radius: 2px;
}

.option-name {
  @include truncate;

  flex: 1;
  min-width: 0;
}
</style>
