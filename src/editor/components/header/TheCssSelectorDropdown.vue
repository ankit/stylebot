<template>
  <s-autocomplete
    mono
    chips
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
  >
    <template v-if="activeStyleCount > 0" #suffix>
      <s-count-badge :count="activeStyleCount" class="active-style-count" />
    </template>

    <template #item="{ item, select }">
      <the-css-selector-dropdown-item
        :selector="item.value"
        :style-count="item.styleCount"
        @select="select"
      />
    </template>
  </s-autocomplete>
</template>

<script lang="ts">
import Vue from 'vue';
import { SAutocomplete, SCountBadge } from '@stylebot/components';
import { validateSelector, getDeclarationsForSelector } from '@stylebot/css';
import { Highlighter } from '@stylebot/highlighter';
import { CssDeclaration, StylebotEditingMode } from '@stylebot/types';

import { CssSelectorMetadata } from '../../store';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    SAutocomplete,
    SCountBadge,
    TheCssSelectorDropdownItem,
  },

  data(): {
    highlighter: Highlighter | null;
    focused: boolean;
    openingSelector: string;
  } {
    return {
      highlighter: null,
      focused: false,
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

    activeStyleCount(): number {
      return this.getStylebotDeclarations(this.activeSelector)?.length ?? 0;
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
      return this.mode !== 'basic';
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

  created() {
    this.highlighter = new Highlighter({
      onSelect: () => {
        return;
      },
      getStylebotDeclarations: this.getStylebotDeclarations,
      getMountRoot: () => this.$root.$el as HTMLElement,
    });
  },

  beforeDestroy() {
    this.highlighter?.unhighlight();
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
      this.highlighter?.unhighlight();
    },

    previewActiveSelector(): void {
      const selector = this.activeSelector.trim();

      if (!selector) {
        this.highlighter?.unhighlight();
        return;
      }

      if (validateSelector(selector)) {
        this.highlighter?.highlight(selector);
      } else {
        this.highlighter?.unhighlight();
      }
    },

    getStylebotDeclarations(selector: string): Array<CssDeclaration> | null {
      return getDeclarationsForSelector(this.$store.state.css, selector);
    },
  },
});
</script>

<style lang="scss" scoped>
.active-style-count {
  margin: 0 6px;
}
</style>
