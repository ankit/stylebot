<template>
  <s-autocomplete
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
    @input="setSelector"
    @select="pickSelector"
    @click.native="stopInspecting"
    @focus="onFocus"
    @blur="onBlur"
    @mouseenter.native="onMouseEnter"
    @mouseleave.native="onMouseLeave"
  >
    <template #chips="{ parts }">
      <s-inline-list mono :parts="parts" />
    </template>

    <template #item="{ item, select }">
      <div v-if="item.header" class="section-header" role="presentation">
        {{ item.header }}
      </div>
      <div v-else-if="item.divider" class="section-divider" role="separator" />
      <the-css-selector-dropdown-item
        v-else
        :selector="item.value"
        :current="item.value === activeSelector"
        :count="countFor(item.value)"
        :styled="styledSelectors.has(item.value)"
        @select="select"
        @preview-end="previewActiveSelector"
      />
    </template>
  </s-autocomplete>
</template>

<script lang="ts">
import Vue from 'vue';
import { SAutocomplete, SInlineList } from '@stylebot/components';
import type { StylebotEditingMode } from '@stylebot/types';

import type { CssSelectorMetadata } from '../../store';
import type { SelectorAlternatives } from '@stylebot/page-bridge';
import { getPageBridge } from '@stylebot/page-bridge';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';

const PSEUDO_ELEMENT = /::|:(before|after|first-line|first-letter)\b/i;

type DropdownEntry = {
  id: string;
  value: string;
  header?: string;
  divider?: boolean;
};

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    SAutocomplete,
    SInlineList,
    TheCssSelectorDropdownItem,
  },

  data(): {
    focused: boolean;
    hovered: boolean;
    openingSelector: string;
    matchCounts: Record<string, number | null>;
  } {
    return {
      matchCounts: {},
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

    alternatives(): SelectorAlternatives {
      return this.$store.state.selectorAlternatives;
    },

    /**
     * Selectors for the element last picked, the active one first, while
     * the field holds (or began editing from) one of them.
     */
    elementSelectors(): Array<string> {
      const { existing, candidates } = this.alternatives;
      const all = [...existing, ...candidates];
      const current = all.includes(this.activeSelector)
        ? [this.activeSelector]
        : [];

      if (!current.length && !all.includes(this.openingSelector)) {
        return [];
      }

      return [...new Set([...current, ...all])];
    },

    // The style's other rules, once each even when a selector has several
    // rules; a selector offered for the element isn't repeated here.
    pageSelectors(): Array<string> {
      return [...new Set(this.selectors.map(s => s.value))].filter(
        value => !this.elementSelectors.includes(value)
      );
    },

    styledSelectors(): Set<string> {
      return new Set([
        ...this.alternatives.existing,
        ...this.selectors.map(s => s.value),
      ]);
    },

    entries(): Array<DropdownEntry> {
      const query = this.activeSelector.trim().toLowerCase();
      const filtering = !!query && this.activeSelector !== this.openingSelector;
      const matches = (selector: string) => {
        const value = selector.toLowerCase();
        return !filtering || (value.includes(query) && value !== query);
      };

      const element = this.elementSelectors.filter(matches);
      const page = this.pageSelectors.filter(matches);

      const entries: Array<DropdownEntry> = [];

      if (element.length) {
        entries.push({
          id: 'header:element',
          value: '',
          header: this.t('this_element'),
        });
        element.forEach(value =>
          entries.push({ id: `element:${value}`, value })
        );
      }

      if (page.length) {
        if (element.length) {
          entries.push({ id: 'divider', value: '', divider: true });
        }

        entries.push({
          id: 'header:page',
          value: '',
          header: this.t('styled_on_this_page'),
        });
        page.forEach(value => entries.push({ id: `page:${value}`, value }));
      }

      return entries;
    },

    disabled(): boolean {
      return this.mode !== 'basic' && this.mode !== 'chat';
    },
  },

  watch: {
    entries(): void {
      if (this.focused) {
        this.loadMatchCounts();
      }
    },

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

    stopInspecting(): void {
      this.$store.commit('setInspecting', false);
    },

    onFocus(): void {
      this.focused = true;
      this.openingSelector = this.activeSelector;
      this.previewActiveSelector();
      this.loadMatchCounts();
    },

    countFor(selector: string): number | null {
      return this.matchCounts[selector] ?? null;
    },

    async loadMatchCounts(): Promise<void> {
      // A pseudo-element isn't an element the page can count, so it'd read 0.
      const selectors = this.entries
        .map(entry => entry.value)
        .filter(value => value && !PSEUDO_ELEMENT.test(value));
      const counts = await getPageBridge().countMatches(selectors);

      this.matchCounts = Object.fromEntries(
        selectors.map((selector, i) => [selector, counts[i]])
      );
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
     * Tints the selector's matches while the field is focused or hovered;
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
.section-header {
  flex: none;
  padding: 10px 10px 4px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-muted);
}

.section-divider {
  flex: none;
  align-self: stretch;
  height: 1px;
  margin: 4px 2px;
  background: color-mix(in srgb, var(--text-primary) 14%, transparent);
}
</style>
