<template>
  <div class="color-picker-popover" role="dialog" :aria-label="roleLabel">
    <color-picker-header
      :value="value"
      :role-label="roleLabel"
      @input="setColor"
      @commit="commit"
      @clear="setColor('')"
    />

    <color-picker-custom
      v-if="customOpen"
      :value="value"
      @input="setColor"
      @commit="commit"
    />

    <color-picker-swatch-group
      class="page-colors"
      :label="t('on_this_page')"
      :colors="pageColors"
      :value="value"
      @select="commit"
    >
      <button
        type="button"
        class="custom-toggle"
        :class="{ open: customOpen }"
        :title="t('custom_color')"
        :aria-label="t('custom_color')"
        :aria-expanded="customOpen ? 'true' : 'false'"
        @click="customOpen = !customOpen"
      >
        <plus-icon :size="12" />
      </button>
    </color-picker-swatch-group>

    <color-picker-swatch-group
      v-if="recentColors.length"
      class="recent-colors"
      :label="t('color_picker_recent')"
      :colors="recentColors"
      :value="value"
      @select="commit"
    />

    <color-picker-palette :value="value" @select="commit" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import tinycolor from 'tinycolor2';
import { PlusIcon } from '@stylebot/icons';
import type { RoleColorGroups } from '@stylebot/css';
import { getPageBridge } from '@stylebot/page-bridge';

import ColorPickerHeader from './ColorPickerHeader.vue';
import ColorPickerCustom from './ColorPickerCustom.vue';
import ColorPickerSwatchGroup from './ColorPickerSwatchGroup.vue';
import ColorPickerPalette from './ColorPickerPalette.vue';
import { getRecentColors, addRecentColor } from '../../utils/chrome';
import { tinycolorToCssColor, uniqueColors } from '../../utils/hsv-color';

// Two rows of swatches, leaving the last slot for the custom color toggle.
const PAGE_COLORS_CAP = 15;

const flatten = (groups: RoleColorGroups): Array<string> => [
  ...groups.text,
  ...groups.surface,
];

export default Vue.extend({
  name: 'ColorPickerPopover',

  components: {
    PlusIcon,
    ColorPickerHeader,
    ColorPickerCustom,
    ColorPickerSwatchGroup,
    ColorPickerPalette,
  },

  props: {
    value: {
      type: String,
      default: '',
    },

    roleLabel: {
      type: String,
      required: true,
    },
  },

  data(): {
    customOpen: boolean;
    pageColors: Array<string>;
    recentColors: Array<string>;
    lastCommittedColor: string;
  } {
    return {
      customOpen: false,
      // A snapshot, not a live getter — must not reshuffle while the user is still picking.
      pageColors: [],
      recentColors: [],
      lastCommittedColor: '',
    };
  },

  async created() {
    const usedColors = flatten(this.$store.getters.alreadyUsedColors);
    this.pageColors = this.capped(usedColors);

    getRecentColors().then(colors => {
      this.recentColors = colors;
    });

    const pageColors = flatten(await getPageBridge().getPageColors());
    this.pageColors = this.capped([...usedColors, ...pageColors]);
  },

  beforeDestroy() {
    // Only the color the user settled on goes to Recent — recorded once, on close, not per commit.
    if (this.lastCommittedColor) {
      addRecentColor(this.lastCommittedColor);
    }
  },

  methods: {
    /**
     * Dedupes the colors and spells each as hex where it can, since the
     * page reports its own as rgb().
     */
    capped(colors: Array<string>): Array<string> {
      return uniqueColors(colors)
        .slice(0, PAGE_COLORS_CAP)
        .map(color => {
          const parsed = tinycolor(color);
          return parsed.isValid() ? tinycolorToCssColor(parsed) : color;
        });
    },

    setColor(color: string): void {
      this.$emit('input', color);
    },

    commit(color: string): void {
      this.$emit('input', color);
      this.lastCommittedColor = color;
    },
  },
});
</script>

<style lang="scss" scoped>
.color-picker-popover {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 268px;
  padding: 12px;
  background: var(--menu-surface);
  border: 1px solid var(--menu-border);
  border-radius: 11px;
  box-shadow: 0 14px 32px var(--menu-shadow);
}

.custom-toggle {
  @include button-reset;

  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px var(--field-border);
  color: var(--icon-color);
  cursor: pointer;

  &:hover {
    color: var(--field-ink);
  }

  &.open {
    background: var(--field-surface-hover);
    color: var(--field-ink);
  }

  @include focus-ring(2px);
}
</style>
