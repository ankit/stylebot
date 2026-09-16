<template>
  <div class="color-picker-popover">
    <color-picker-header :value="value" :role-label="roleLabel" @input="commit" @clear="setColor('')" />

    <color-picker-tabs
      :value="activeTab"
      :first-tab-label="firstTabLabel"
      :first-tab-disabled="firstTabDisabled"
      @change="setTab"
    />

    <div class="tab-content">
      <color-picker-first-tab
        v-if="activeTab === 'already-used'"
        :colors="firstTabColors"
        :recent-colors="recentColors"
        :value="value"
        @select="commit"
      />

      <color-picker-palette v-else-if="activeTab === 'palette'" :value="value" @select="commit" />

      <color-picker-custom v-else :value="value" @input="setColor" @commit="commit" />
    </div>

    <color-picker-footer :value="value" @input="setColor" @commit="commit" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { RoleColorGroups } from '@stylebot/css';

import ColorPickerHeader from './ColorPickerHeader.vue';
import ColorPickerTabs from './ColorPickerTabs.vue';
import ColorPickerFirstTab from './ColorPickerFirstTab.vue';
import ColorPickerPalette from './ColorPickerPalette.vue';
import ColorPickerCustom from './ColorPickerCustom.vue';
import ColorPickerFooter from './ColorPickerFooter.vue';
import { getPageColors } from '../../utils/page-colors';
import { getRecentColors, addRecentColor } from '../../utils/chrome';

type Tab = 'already-used' | 'palette' | 'custom';

const EMPTY_COLORS: RoleColorGroups = { text: [], surface: [], total: 0 };

export default Vue.extend({
  name: 'ColorPickerPopover',

  components: {
    ColorPickerHeader,
    ColorPickerTabs,
    ColorPickerFirstTab,
    ColorPickerPalette,
    ColorPickerCustom,
    ColorPickerFooter,
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
    activeTab: Tab;
    alreadyUsedColors: RoleColorGroups;
    pageColors: RoleColorGroups;
    recentColors: Array<string>;
    lastCommittedColor: string;
  } {
    return {
      activeTab: 'already-used',
      // A snapshot, not a live getter — must not reshuffle while the user is still picking.
      alreadyUsedColors: EMPTY_COLORS,
      pageColors: EMPTY_COLORS,
      recentColors: [],
      lastCommittedColor: '',
    };
  },

  computed: {
    firstTabSource(): 'rules' | 'page' {
      return this.alreadyUsedColors.total > 0 ? 'rules' : 'page';
    },

    firstTabColors(): RoleColorGroups {
      return this.firstTabSource === 'rules' ? this.alreadyUsedColors : this.pageColors;
    },

    firstTabDisabled(): boolean {
      return this.firstTabColors.total === 0 && this.recentColors.length === 0;
    },

    firstTabLabel(): string {
      return this.firstTabSource === 'rules'
        ? this.t('color_picker_tab_your_colors')
        : this.t('color_picker_tab_page_colors');
    },
  },

  created() {
    this.alreadyUsedColors = this.$store.getters.alreadyUsedColors;

    if (this.alreadyUsedColors.total === 0) {
      this.pageColors = getPageColors();
    }

    const lastTab = this.$store.state.options.lastColorPickerTab as Tab;
    const canRestoreLastTab = lastTab !== 'already-used' || !this.firstTabDisabled;

    this.activeTab = canRestoreLastTab ? lastTab : this.firstTabDisabled ? 'custom' : 'already-used';

    getRecentColors().then(colors => {
      this.recentColors = colors;
    });
  },

  beforeDestroy() {
    // Only the color the user settled on goes to Recent — recorded once, on close, not per commit.
    if (this.lastCommittedColor) {
      addRecentColor(this.lastCommittedColor);
    }
  },

  methods: {
    setTab(tab: Tab): void {
      this.activeTab = tab;
      this.$store.dispatch('setLastColorPickerTab', tab);
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
  width: 344px;
  background: var(--menu-surface);
  border: 1px solid var(--menu-border);
  border-radius: 13px;
  box-shadow: 0 18px 44px var(--menu-shadow);
  // No overflow: hidden — the Palette tab's search dropdown needs to extend past this box.
}
</style>
