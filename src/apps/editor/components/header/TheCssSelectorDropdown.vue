<template>
  <s-autocomplete
    menu-size="small"
    mono
    large
    chips
    blur-on-commit
    class="selector-autocomplete"
    :value="fieldValue"
    :items="entries"
    :disabled="disabled"
    :min-width="300"
    :placeholder="t('pick_anything_on_the_page')"
    :clear-label="t('clear_selector')"
    :show-chevron="hasOtherRules"
    @input="setSelector"
    @select="pickSelector"
    @submit="commitDraft"
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
        @hook:mounted="fitSelector"
      >
        <template #text>
          <span class="selector-tooltip">{{ activeSelector }}</span>
        </template>
        <span class="selector-text">
          <span
            v-if="droppedAncestors && !headClipped"
            class="selector-ellipsis"
            aria-hidden="true"
          >
            <more-icon :size="14" />
          </span>
          <s-inline-list
            mono
            :parts="splitTail(shownParts(parts)).head"
            class="selector-head"
            :class="{ clipped: headClipped }"
            :style="
              headWidth ? { flex: 'none', width: `${headWidth}px` } : null
            "
          />
          <span
            v-if="headClipped"
            class="selector-ellipsis middle"
            aria-hidden="true"
          >
            <more-icon :size="14" />
          </span>
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
import { MoreIcon } from '@stylebot/icons';
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
    MoreIcon,
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
    headClipped: boolean;
    headWidth: number;
    fitRun: number;
    resizeObserver: ResizeObserver | null;
    openingSelector: string;
    draft: string | null;
  } {
    return {
      // What's typed in Code mode, applied once committed: every selector
      // applied there adds an empty rule to the stylesheet.
      draft: null,
      focused: false,
      hovered: false,
      truncated: false,
      droppedAncestors: 0,
      partialStart: 0,
      headClipped: false,
      headWidth: 0,
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

    fieldValue(): string {
      return this.draft ?? this.activeSelector;
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
      const query = this.fieldValue.trim().toLowerCase();
      const filtering = !!query && this.fieldValue !== this.openingSelector;
      const matches = (selector: string) => {
        const value = selector.toLowerCase();
        return !filtering || (value.includes(query) && value !== query);
      };

      return this.pageSelectors
        .filter(matches)
        .map(value => ({ id: `page:${value}`, value }));
    },

    disabled(): boolean {
      return this.mode !== 'basic' && this.mode !== 'code';
    },
  },

  watch: {
    activeSelector(): void {
      this.fitSelector();
    },

    // Re-preview on every keystroke while focused, not just on select —
    // setSelector already updates the field's value as the user types.
    fieldValue(): void {
      if (this.focused) {
        this.previewMatches();
      }
    },

    focused: 'fitSelector',
  },

  mounted() {
    this.resizeObserver = new ResizeObserver(() => this.fitSelector());
    this.resizeObserver.observe(this.$el);
    document.fonts?.addEventListener('loadingdone', this.fitSelector);
    this.fitSelector();
  },

  beforeDestroy() {
    this.resizeObserver?.disconnect();
    document.fonts?.removeEventListener('loadingdone', this.fitSelector);
    stopPeek();
    getPageBridge().unhighlight();
  },

  methods: {
    splitTail,

    /**
     * The selector as the chips show it: without the leading ancestors that
     * don't fit, which an ellipsis stands in for.
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

      return [`${partial}${kept}`.trimStart()];
    },

    /**
     * Drops whole leading ancestors, one at a time, until the selector fits
     * the field. When no ancestor left in view has a class, id, attribute or
     * pseudo-class, keeps as much of the last dropped one's end as fits, so
     * it's never just `… a` or `… div button`. What still doesn't fit is
     * cut in the middle instead, the only cut shown.
     */
    async fitSelector(): Promise<void> {
      const run = ++this.fitRun;
      const stale = () => run !== this.fitRun;

      this.droppedAncestors = 0;
      this.partialStart = 0;
      this.headClipped = false;
      this.headWidth = 0;
      await this.$nextTick();

      if (stale() || !this.$el.querySelector('.selector-head')) {
        return;
      }

      await this.fitSteps(stale);

      if (stale() || !this.overflows()) {
        return;
      }

      this.headClipped = true;
      this.partialStart = 0;
      await this.$nextTick();

      if (!stale()) {
        this.headWidth = this.wholeCharacterWidth();
      }
    },

    /**
     * The widest the selector's start can be while ending on a whole
     * character, as a text ellipsis would; the font is monospaced.
     */
    wholeCharacterWidth(): number {
      const head = this.$el.querySelector('.selector-head');
      const length = head?.textContent?.length;

      if (!head || !length) {
        return 0;
      }

      const character = head.scrollWidth / length;

      return Math.floor(head.clientWidth / character) * character;
    },

    /**
     * Drops whole leading ancestors until the selector fits, then fills any
     * room left with the end of the last one dropped.
     */
    async fitSteps(stale: () => boolean): Promise<void> {
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
      if (this.mode === 'code') {
        this.draft = value;
        return;
      }

      this.$store.commit('setActiveSelector', value);
    },

    pickSelector(item: DropdownEntry): void {
      this.draft = null;
      this.$store.commit('setActiveSelector', item.value);
    },

    commitDraft(): void {
      const { draft } = this;
      this.draft = null;

      if (draft !== null && draft !== this.activeSelector) {
        this.$store.commit('setActiveSelector', draft);
      }
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
      this.commitDraft();

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

      const selector = this.fieldValue.trim();

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

  &.clipped {
    text-overflow: clip;
  }
}

.selector-ellipsis {
  flex: none;
  display: inline-flex;
  align-items: center;
  margin-right: 5px;
  color: var(--text-secondary);
  transform: translateY(3px);

  &.middle {
    margin: 0 1px;
  }
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
