<template>
  <div class="palette">
    <s-autocomplete
      class="palette-search"
      item-key="key"
      :value="query"
      :items="filteredOptions"
      :placeholder="t('color_picker_search_palettes')"
      @input="query = $event"
      @focus="openingQuery = query"
      @cancel="query = activeLabel"
    >
      <template #item="{ item, select }">
        <menu-item
          :selected="item.key === activeKey"
          @click="
            selectOption(item);
            select();
          "
        >
          <span class="option-row">
            <span class="option-bars">
              <span
                v-for="color in item.preview"
                :key="color"
                class="option-bar"
                :style="{ background: color }"
              />
            </span>
            <span class="option-name">{{ item.label }}</span>
          </span>
        </menu-item>
      </template>
    </s-autocomplete>

    <div v-if="activeKey === 'neutrals'" class="ramps">
      <div v-for="ramp in neutralRamps" :key="ramp.labelKey" class="ramp">
        <s-text size="small" variant="muted" as="span">
          {{ t(ramp.labelKey) }}
        </s-text>
        <div class="set-grid">
          <button
            v-for="color in ramp.colors"
            :key="color"
            type="button"
            class="swatch"
            :class="{ light: needsHairline(color) }"
            :style="{ background: color }"
            @click="$emit('select', color)"
          >
            <check-icon
              v-if="color === value"
              :size="14"
              class="swatch-check"
              :style="{ color: checkMarkColor(color) }"
            />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="set-grid">
      <button
        v-for="color in activeColors"
        :key="color"
        type="button"
        class="swatch"
        :class="{ light: needsHairline(color) }"
        :style="{ background: color }"
        @click="$emit('select', color)"
      >
        <check-icon
          v-if="color === value"
          :size="14"
          class="swatch-check"
          :style="{ color: checkMarkColor(color) }"
        />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
// Flattened into one search/select rather than a nested set+scheme picker.
import Vue from 'vue';
import { SAutocomplete, SText, MenuItem } from '@stylebot/components';
import { CheckIcon } from '@stylebot/icons';
import { colorSchemes } from '../../utils/color-schemes';
import {
  neutralRamps,
  hueGrid,
  readingRow,
  darkModeRow,
  ColorRamp,
} from '../../utils/color-sets';
import { needsHairline, checkMarkColor } from '../../utils/hsv-color';

type PaletteOption = { key: string; label: string; preview: Array<string> };
type PaletteOptionMeta = {
  key: string;
  labelKey: string;
  preview: Array<string>;
};

// Translated in data() via this.t(), not at module scope — Jest mocks t() per-component, not a global chrome.
const SET_OPTION_META: Array<PaletteOptionMeta> = [
  {
    key: 'neutrals',
    labelKey: 'color_picker_set_neutrals',
    preview: neutralRamps[0].colors.slice(0, 6),
  },
  {
    key: 'hues',
    labelKey: 'color_picker_set_hues',
    preview: hueGrid[2].slice(0, 6),
  },
  {
    key: 'reading',
    labelKey: 'color_picker_set_reading',
    preview: readingRow.slice(0, 6),
  },
  {
    key: 'dark-mode',
    labelKey: 'color_picker_set_dark_mode',
    preview: darkModeRow.slice(0, 6),
  },
];

const SCHEME_OPTIONS: Array<PaletteOption> = colorSchemes.map(scheme => ({
  key: scheme.name,
  label: scheme.name,
  preview: scheme.colors.slice(0, 6),
}));

export default Vue.extend({
  name: 'ColorPickerPalette',

  components: {
    SAutocomplete,
    SText,
    MenuItem,
    CheckIcon,
  },

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  data(): {
    activeKey: string;
    query: string;
    openingQuery: string;
    neutralRamps: Array<ColorRamp>;
    allOptions: Array<PaletteOption>;
  } {
    const allOptions: Array<PaletteOption> = [
      ...SET_OPTION_META.map(option => ({
        key: option.key,
        label: this.t(option.labelKey),
        preview: option.preview,
      })),
      ...SCHEME_OPTIONS,
    ];

    const lastColorSet = this.$store.state.options.lastColorSet;
    const activeKey = allOptions.some(option => option.key === lastColorSet)
      ? lastColorSet
      : 'neutrals';

    return {
      activeKey,
      query: allOptions.find(option => option.key === activeKey)?.label || '',
      // The query as it was when editing began (focus or chevron); until
      // it's changed, every palette is listed rather than filtering by it.
      openingQuery: '',
      neutralRamps,
      allOptions,
    };
  },

  computed: {
    activeLabel(): string {
      return (
        this.allOptions.find(option => option.key === this.activeKey)?.label ||
        ''
      );
    },

    filteredOptions(): Array<PaletteOption> {
      const query = this.query.trim().toLowerCase();
      if (
        !query ||
        this.query === this.openingQuery ||
        query === this.activeLabel.toLowerCase()
      ) {
        return this.allOptions;
      }

      return this.allOptions.filter(option =>
        option.label.toLowerCase().includes(query)
      );
    },

    activeColors(): Array<string> {
      switch (this.activeKey) {
        case 'hues':
          return hueGrid.flat();
        case 'reading':
          return readingRow;
        case 'dark-mode':
          return darkModeRow;
        default: {
          const scheme = colorSchemes.find(s => s.name === this.activeKey);
          return scheme ? scheme.colors : [];
        }
      }
    },
  },

  methods: {
    needsHairline,
    checkMarkColor,

    selectOption(option: PaletteOption): void {
      this.activeKey = option.key;
      this.query = option.label;
      this.$store.dispatch('setLastColorSet', option.key);
    },
  },
});
</script>

<style lang="scss" scoped>
@import './color-picker-mixins';

.palette {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.palette-search {
  width: 100%;

  ::v-deep .autocomplete-input {
    line-height: 18px;
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
  width: 9px;
  height: 16px;
  border-radius: 2px;
}

.option-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ramps {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.ramp {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.set-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  // Tall enough for Hues' 5 rows (the largest set) without scrolling.
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
  margin: -4px;
}

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
