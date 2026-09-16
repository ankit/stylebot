<template>
  <div class="palette">
    <s-autocomplete
      class="palette-search"
      item-key="key"
      :value="query"
      :items="filteredOptions"
      :placeholder="t('color_picker_search_palettes')"
      @input="query = $event"
    >
      <template #item="{ item, select }">
        <menu-item :selected="item.key === activeKey" @click="selectOption(item); select();">
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
      <div v-for="ramp in neutralRamps" :key="ramp.label" class="ramp">
        <s-text size="small" variant="muted" as="span">{{ ramp.label }}</s-text>
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
            <check-icon v-if="color === value" :size="14" class="swatch-check" />
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
        <check-icon v-if="color === value" :size="14" class="swatch-check" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
// The design spec's 6-set dropdown, minus Recent (cross-site history, now
// in the Already-used tab) and flattened into one search/select rather than
// a set picker with a scheme picker nested inside it — the "closest scheme
// to this page" matching heuristic is still a follow-up phase.
import Vue from 'vue';
import { SAutocomplete, SText, MenuItem } from '@stylebot/components';
import { CheckIcon } from '@stylebot/icons';
import { colorSchemes } from '../../utils/color-schemes';
import { neutralRamps, hueGrid, readingRow, darkModeRow, ColorRamp } from '../../utils/color-sets';
import { needsHairline } from '../../utils/hsv-color';

type PaletteOption = { key: string; label: string; preview: Array<string> };

const SET_OPTIONS: Array<PaletteOption> = [
  { key: 'neutrals', label: 'Neutrals', preview: neutralRamps[0].colors.slice(0, 6) },
  { key: 'hues', label: 'Hues', preview: hueGrid[2].slice(0, 6) },
  { key: 'reading', label: 'Reading', preview: readingRow.slice(0, 6) },
  { key: 'dark-mode', label: 'Dark mode', preview: darkModeRow.slice(0, 6) },
];

const SCHEME_OPTIONS: Array<PaletteOption> = colorSchemes.map(scheme => ({
  key: scheme.name,
  label: scheme.name,
  preview: scheme.colors.slice(0, 6),
}));

const ALL_OPTIONS: Array<PaletteOption> = [...SET_OPTIONS, ...SCHEME_OPTIONS];

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

  data(): { activeKey: string; query: string; neutralRamps: Array<ColorRamp> } {
    const lastColorSet = this.$store.state.options.lastColorSet;
    const activeKey = ALL_OPTIONS.some(option => option.key === lastColorSet)
      ? lastColorSet
      : 'neutrals';

    return {
      activeKey,
      query: ALL_OPTIONS.find(option => option.key === activeKey)?.label || '',
      neutralRamps,
    };
  },

  computed: {
    filteredOptions(): Array<PaletteOption> {
      const query = this.query.trim().toLowerCase();
      const activeLabel = ALL_OPTIONS.find(option => option.key === this.activeKey)?.label || '';
      if (!query || query === activeLabel.toLowerCase()) {
        return ALL_OPTIONS;
      }

      return ALL_OPTIONS.filter(option => option.label.toLowerCase().includes(query));
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

    selectOption(option: PaletteOption): void {
      this.activeKey = option.key;
      this.query = option.label;
      this.$store.dispatch('setLastColorSet', option.key);
    },
  },
});
</script>

<style lang="scss" scoped>
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
