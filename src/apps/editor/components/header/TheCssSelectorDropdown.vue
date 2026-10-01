<template>
  <s-autocomplete
    mono
    chips
    blur-on-commit
    class="selector-autocomplete"
    :value="activeSelector"
    :items="filteredSelectors"
    :disabled="disabled"
    :min-width="300"
    :placeholder="t('pick_an_element')"
    @input="setSelector"
    @select="pickSelector"
    @click.native="stopInspecting"
    @focus="onFocus"
    @blur="onBlur"
    @mouseenter.native="onMouseEnter"
    @mouseleave.native="onMouseLeave"
  >
    <template #chips="{ parts }">
      <selector-chips :parts="parts" />
    </template>

    <template #item="{ item, select }">
      <the-css-selector-dropdown-item
        :selector="item.value"
        @select="select"
        @preview-end="previewActiveSelector"
      />
    </template>
  </s-autocomplete>
</template>

<script lang="ts">
import Vue from 'vue';
import { SAutocomplete } from '@stylebot/components';
import type { StylebotEditingMode } from '@stylebot/types';

import type { CssSelectorMetadata } from '../../store';
import { getPageBridge } from '@stylebot/page-bridge';
import SelectorChips from './SelectorChips.vue';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    SAutocomplete,
    SelectorChips,
    TheCssSelectorDropdownItem,
  },

  data(): { focused: boolean; hovered: boolean; openingSelector: string } {
    return {
      focused: false,
      hovered: false,
      // The selector as it was when editing began; until it's changed, the
      // suggestions list everything rather than filtering by it.
      openingSelector: '',
    };
  },

  computed: {
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    selectors(): Array<CssSelectorMetadata> {
      return this.$store.state.selectors;
    },

    filteredSelectors(): Array<CssSelectorMetadata> {
      const query = this.activeSelector.trim().toLowerCase();
      if (!query || this.activeSelector === this.openingSelector) {
        return this.selectors;
      }

      return this.selectors.filter(s => {
        const value = s.value.toLowerCase();
        return value.includes(query) && value !== query;
      });
    },

    disabled(): boolean {
      return this.mode !== 'basic' && this.mode !== 'chat';
    },
  },

  watch: {
    // Re-preview on every keystroke while focused, not just on select —
    // setSelector already updates activeSelector as the user types.
    activeSelector(): void {
      if (this.focused) {
        this.previewActiveSelector();
      }
    },
  },

  beforeDestroy() {
    getPageBridge().unhighlight();
  },

  methods: {
    setSelector(value: string): void {
      this.$store.commit('setActiveSelector', value);
    },

    pickSelector(item: CssSelectorMetadata): void {
      this.$store.commit('setActiveSelector', item.value);
    },

    stopInspecting(): void {
      this.$store.commit('setInspecting', false);
    },

    onFocus(): void {
      this.focused = true;
      this.openingSelector = this.activeSelector;
      this.previewActiveSelector();
    },

    onBlur(): void {
      this.focused = false;

      if (!this.hovered) {
        getPageBridge().unhighlight();
      }
    },

    onMouseEnter(): void {
      this.hovered = true;
      this.previewActiveSelector();
    },

    onMouseLeave(): void {
      this.hovered = false;

      if (!this.focused) {
        getPageBridge().unhighlight();
      }
    },

    /**
     * Tints the selector's matches while the field is focused or hovered;
     * the inspector draws its own highlight while picking.
     */
    previewActiveSelector(): void {
      if (!(this.focused || this.hovered) || this.$store.state.inspecting) {
        return;
      }

      const selector = this.activeSelector.trim();

      if (selector) {
        getPageBridge().highlight(selector);
      } else {
        getPageBridge().unhighlight();
      }
    },
  },
});
</script>
