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
    :placeholder="t('pick_anything_on_the_page')"
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
        <span class="selector-text">
          <s-inline-list
            mono
            :parts="splitTail(shownParts(parts)).head"
            class="selector-head"
          />
          <span
            v-if="splitTail(shownParts(parts)).tail"
            class="selector-tail"
            v-text="splitTail(shownParts(parts)).tail"
          />
        </span>
      </s-tooltip>
    </template>

    <template #item="{ item, select }">
      <the-css-selector-dropdown-item
        :selector="item.value"
        :current="item.value === activeSelector"
        @select="select"
        @preview-end="previewMatches"
      />
    </template>
  </s-autocomplete>
</template>

<script lang="ts">
import Vue from 'vue';
import { SAutocomplete, SInlineList, STooltip } from '@stylebot/components';
import type { StylebotEditingMode } from '@stylebot/types';
import { splitSelectorList, splitSelectorSteps } from '@stylebot/css';

import type { CssSelectorMetadata } from '../../store';
import { getPageBridge } from '@stylebot/page-bridge';
import {
  peekSelectorMatches,
  isPeeking,
  stopPeek,
} from '../../utils/selector-peek';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';

const TAIL_MAX = 20;
const TAIL_MIN = 8;
const BOUNDARY = /[\s>+~.#[:"-]/;
const STARTS_TOKEN = /[.#[:]/;
const ENDS_WORD = /[-_"'=]/;
const NOT_A_START = /[-_"'=\])]/;

/**
 * Whether a step says more than a bare tag name, like `div` or `> span`.
 */
const isDistinctive = (step: string): boolean => STARTS_TOKEN.test(step);

/**
 * Where an ancestor could be cut to keep its end, longest first: before a
 * class, id, attribute or pseudo-class, or after a hyphen, quote or `=`.
 */
function partialStarts(step: string): Array<number> {
  const first = step.search(/[^\s>+~]/);
  const starts: Array<number> = [];

  for (let i = first + 1; i < step.length; i++) {
    const startsWord =
      ENDS_WORD.test(step[i - 1]) && !NOT_A_START.test(step[i]);

    if (STARTS_TOKEN.test(step[i]) || startsWord) {
      starts.push(i);
    }
  }

  return starts;
}
/**
 * Splits off the end of the last selector so it stays in view when the field
 * is too narrow, cutting at a boundary within its last few characters.
 */
function splitTail(parts: Array<string>): {
  head: Array<string>;
  tail: string;
} {
  const last = parts[parts.length - 1] ?? '';
  if (last.length <= TAIL_MAX) {
    return { head: parts, tail: '' };
  }

  const end = last.length - TAIL_MIN;
  let cut = last.length - TAIL_MAX;

  while (cut < end && !BOUNDARY.test(last[cut])) {
    cut++;
  }

  if (cut >= end) {
    cut = last.length - TAIL_MAX;
  }

  // The head drops trailing spaces at its end, so they go to the tail.
  while (cut > 0 && /\s/.test(last[cut - 1])) {
    cut--;
  }

  return {
    head: [...parts.slice(0, -1), last.slice(0, cut)],
    tail: last.slice(cut),
  };
}

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
    droppedAncestors: number;
    partialStart: number;
    fitRun: number;
    resizeObserver: ResizeObserver | null;
    openingSelector: string;
  } {
    return {
      focused: false,
      hovered: false,
      truncated: false,
      droppedAncestors: 0,
      partialStart: 0,
      fitRun: 0,
      resizeObserver: null,
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
      this.fitSelector();

      if (this.focused) {
        this.previewMatches();
      }
    },

    focused: 'fitSelector',
  },

  mounted() {
    this.resizeObserver = new ResizeObserver(() => this.fitSelector());
    this.resizeObserver.observe(this.$el);
    this.fitSelector();
  },

  beforeDestroy() {
    this.resizeObserver?.disconnect();
    stopPeek();
    getPageBridge().unhighlight();
  },

  methods: {
    splitTail,

    /**
     * The selector as the chips show it: with its leading ancestors swapped
     * for an ellipsis once there are too many to fit.
     */
    shownParts(parts: Array<string>): Array<string> {
      if (parts.length !== 1 || !this.droppedAncestors) {
        return parts;
      }

      const steps = splitSelectorSteps(parts[0]);
      const kept = steps.slice(this.droppedAncestors).join('');
      const partial = this.partialStart
        ? steps[this.droppedAncestors - 1].slice(this.partialStart)
        : '';

      return [`…${partial}${kept}`];
    },

    /**
     * Drops whole leading ancestors, one at a time, until the selector fits
     * the field. When no ancestor left in view has a class, id, attribute or
     * pseudo-class, keeps as much of the last dropped one's end as fits, so
     * it's never just `… a` or `… div button`.
     */
    async fitSelector(): Promise<void> {
      const run = ++this.fitRun;
      const stale = () => run !== this.fitRun;

      this.droppedAncestors = 0;
      this.partialStart = 0;
      await this.$nextTick();

      const parts = splitSelectorList(this.activeSelector);

      if (parts.length !== 1) {
        return;
      }

      const steps = splitSelectorSteps(parts[0]);
      const ancestors = steps.length - 1;

      while (this.droppedAncestors < ancestors && this.overflows()) {
        this.droppedAncestors++;
        await this.$nextTick();

        if (stale()) {
          return;
        }
      }

      const dropped = this.droppedAncestors;
      const shownAncestors = steps.slice(dropped, ancestors);

      if (stale() || !dropped || shownAncestors.some(isDistinctive)) {
        return;
      }

      for (const start of partialStarts(steps[dropped - 1])) {
        this.partialStart = start;
        await this.$nextTick();

        if (stale() || !this.overflows()) {
          return;
        }
      }

      this.partialStart = 0;
    },

    overflows(): boolean {
      const text = this.$el.querySelector('.selector-head');

      return !!text && text.scrollWidth > text.clientWidth;
    },

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
      const text = this.$el.querySelector('.selector-head');

      this.truncated =
        this.droppedAncestors > 0 ||
        (!!text && text.scrollWidth > text.clientWidth);
    },

    stopInspecting(): void {
      this.$store.commit('setInspecting', false);
    },

    onFocus(): void {
      this.focused = true;
      this.openingSelector = this.activeSelector;
      this.previewMatches();
    },

    onBlur(): void {
      this.focused = false;

      if (!this.hovered && !this.disabled && !isPeeking()) {
        getPageBridge().unhighlight();
      }
    },

    onMouseEnter(): void {
      this.hovered = true;
      this.previewMatches();
    },

    onMouseLeave(): void {
      this.hovered = false;

      if (!this.focused && !this.disabled && !isPeeking()) {
        getPageBridge().unhighlight();
      }
    },

    /**
     * Shows what a picked element's selector matches for a moment, so its
     * reach shows on the page without hovering anything.
     */
    peekMatches(): void {
      const selector = this.activeSelector.trim();

      if (
        this.disabled ||
        this.focused ||
        this.$store.state.inspecting ||
        !selector
      ) {
        return;
      }

      peekSelectorMatches(selector, () => this.focused || this.hovered);
    },

    /**
     * Boxes the selector's matches while the field is focused or hovered;
     * the inspector draws its own highlight while picking.
     */
    previewMatches(): void {
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

.selector-autocomplete ::v-deep .autocomplete-chips ~ .autocomplete-clear {
  position: relative;
  width: 36px;
  margin-left: -36px;
  padding-left: 14px;
  background: linear-gradient(to right, transparent, var(--clear-fade) 14px);
}

.selector-autocomplete ::v-deep .autocomplete-pill {
  --clear-fade: var(--field-surface);

  .autocomplete-chips,
  .autocomplete-input {
    font-size: 12px;
  }

  &:hover:not(.disabled),
  &:has(.autocomplete-chips:focus-visible:not(.quiet)) {
    --clear-fade: var(--field-surface-hover);
  }
}

.selector-text {
  display: flex;
  min-width: 0;
  contain: inline-size;
}

.selector-head {
  @include truncate;
}

.selector-tail {
  flex: none;
  font-family: var(--font-mono);
  color: var(--field-ink);
  white-space: pre;
}

.selector-tooltip {
  font-family: var(--font-mono);
}
</style>
