<template>
  <s-autocomplete
    menu-size="small"
    mono
    large
    chips
    blur-on-commit
    class="selector-autocomplete"
    :value="activeSelector"
    :items="entries"
    :disabled="disabled"
    :min-width="300"
    :placeholder="t('pick_an_element')"
    :clear-label="t('clear_selector')"
    :show-chevron="hasOtherRules"
    @input="setSelector"
    @select="pickSelector"
    @click.native="stopInspecting"
    @focus="onFocus"
    @blur="onBlur"
    @mouseenter.native="onMouseEnter"
    @mouseleave.native="onMouseLeave"
  >
    <template #chips="{ parts }">
      <s-tooltip
        :text="activeSelector"
        :disabled="!truncated"
        grow
        @mouseenter.native="measureTruncation"
      >
        <template #text>
          <span class="selector-tooltip">{{ activeSelector }}</span>
        </template>
        <s-inline-list mono :parts="parts" class="selector-text" />
      </s-tooltip>
    </template>

    <template #item="{ item, select }">
      <the-css-selector-dropdown-item
        :selector="item.value"
        :current="item.value === activeSelector"
        @select="select"
        @preview-end="previewActiveSelector"
      />
    </template>
  </s-autocomplete>
</template>

<script lang="ts">
import Vue from 'vue';
import { SAutocomplete, SInlineList, STooltip } from '@stylebot/components';
import type { StylebotEditingMode } from '@stylebot/types';

import type { CssSelectorMetadata } from '../../store';
import { getPageBridge } from '@stylebot/page-bridge';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';

type DropdownEntry = {
  id: string;
  value: string;
};

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    SAutocomplete,
    SInlineList,
    STooltip,
    TheCssSelectorDropdownItem,
  },

  data(): {
    focused: boolean;
    hovered: boolean;
    truncated: boolean;
    openingSelector: string;
  } {
    return {
      focused: false,
      hovered: false,
      truncated: false,
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

    // The style's rules, once each even when a selector has several rules.
    pageSelectors(): Array<string> {
      return [...new Set(this.selectors.map(s => s.value))];
    },

    /**
     * Whether the menu would offer anything besides the current selector.
     */
    hasOtherRules(): boolean {
      return this.pageSelectors.some(value => value !== this.activeSelector);
    },

    entries(): Array<DropdownEntry> {
      const query = this.activeSelector.trim().toLowerCase();
      const filtering = !!query && this.activeSelector !== this.openingSelector;
      const matches = (selector: string) => {
        const value = selector.toLowerCase();
        return !filtering || (value.includes(query) && value !== query);
      };

      return this.pageSelectors
        .filter(matches)
        .map(value => ({ id: `page:${value}`, value }));
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

  beforeDestroy() {
    getPageBridge().unhighlight();
  },

  methods: {
    setSelector(value: string): void {
      this.$store.commit('setActiveSelector', value);
    },

    pickSelector(item: DropdownEntry): void {
      this.$store.commit('setActiveSelector', item.value);
    },

    /**
     * Notes whether the selector is cut short, so its tooltip only shows
     * when there's more to read.
     */
    measureTruncation(): void {
      const text = this.$el.querySelector('.selector-text');

      this.truncated = !!text && text.scrollWidth > text.clientWidth;
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

      if (!this.hovered && !this.disabled) {
        getPageBridge().unhighlight();
      }
    },

    onMouseEnter(): void {
      this.hovered = true;
      this.previewActiveSelector();
    },

    onMouseLeave(): void {
      this.hovered = false;

      if (!this.focused && !this.disabled) {
        getPageBridge().unhighlight();
      }
    },

    /**
     * Boxes the selector's matches while the field is focused or hovered;
     * the inspector draws its own highlight while picking.
     */
    previewActiveSelector(): void {
      if (
        this.disabled ||
        !(this.focused || this.hovered) ||
        this.$store.state.inspecting
      ) {
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

<style lang="scss" scoped>
.selector-autocomplete:not(:hover):not(:focus-within)
  ::v-deep
  .autocomplete-clear {
  visibility: hidden;
}

.selector-text {
  @include truncate;

  display: block;
  contain: inline-size;
}

.selector-tooltip {
  font-family: var(--font-mono);
}
</style>
