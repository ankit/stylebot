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

    <template v-if="filteredSelectors.length" #header>
      <div class="dropdown-header">
        <s-text size="caption" variant="muted" class="dropdown-header-label">
          {{ t('selector') }}
        </s-text>
        <s-text size="caption" variant="muted" class="dropdown-header-label">
          {{ t('properties') }}
        </s-text>
      </div>
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
import { SAutocomplete, SText, SCountBadge } from '@stylebot/components';
import {
  validateSelector,
  getDeclarationsForSelector,
  splitSelectorList,
} from '@stylebot/css';
import { Highlighter } from '@stylebot/highlighter';
import { CssDeclaration, StylebotEditingMode } from '@stylebot/types';

import { CssSelectorMetadata } from '../../store';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    SAutocomplete,
    SText,
    SCountBadge,
    TheCssSelectorDropdownItem,
  },

  data(): { highlighter: Highlighter | null; focused: boolean } {
    return {
      highlighter: null,
      focused: false,
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
      const match = this.selectors.find(s => s.value === this.activeSelector);
      return match ? match.styleCount : 0;
    },

    filteredSelectors(): Array<CssSelectorMetadata> {
      const query = this.activeSelector.trim().toLowerCase();
      if (!query) {
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
      this.previewActiveSelector();
    },

    onBlur(): void {
      this.focused = false;
      this.highlighter?.unhighlight();
    },

    previewActiveSelector(): void {
      const selector = this.activeSelector.trim();

      // Skip whole-page selectors — highlighting them just floods the page.
      const wholePage = ['*', 'body', 'html', ':root'];
      const parts = splitSelectorList(selector);

      if (!selector || parts.some(part => wholePage.includes(part))) {
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
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -4px -4px 4px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--hover-tint);
}

.dropdown-header-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.active-style-count {
  margin: 0 6px;
}
</style>
