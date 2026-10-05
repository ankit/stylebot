<template>
  <s-menu-item
    class="css-selector-dropdown-item"
    :class="{ current }"
    :selected="current"
    @click="click"
    @mouseenter.native="preview"
    @mouseleave.native="clearPreview"
    @focus.native="preview"
    @blur.native="clearPreview"
  >
    <span class="item-row">
      <s-tooltip
        :text="selector"
        :disabled="!truncated"
        grow
        @mouseenter.native="measureTruncation"
      >
        <template #text>
          <span class="selector-tooltip">{{ selector }}</span>
        </template>
        <span ref="text" class="item-text">
          <span class="item-selector">
            <span
              v-for="(piece, i) in short.pieces"
              :key="i"
              class="piece"
              :class="piece.kind"
              v-text="piece.text"
            />
          </span>
          <span v-if="short.more" class="item-more" v-text="`+${short.more}`" />
        </span>
      </s-tooltip>
      <span
        v-if="count !== null"
        class="item-count"
        :aria-label="
          t(count === 1 ? 'matches_count_one' : 'matches_count_other', [
            String(count),
          ])
        "
        v-text="count"
      />
    </span>
  </s-menu-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SMenuItem, STooltip } from '@stylebot/components';

import { getPageBridge } from '@stylebot/page-bridge';
import type { ShortSelector } from '../../utils/short-selector';
import { shortenSelector } from '../../utils/short-selector';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    SMenuItem,
    STooltip,
  },

  props: {
    selector: {
      type: String,
      required: true,
    },

    current: {
      type: Boolean,
      default: false,
    },

    // How many of the page's elements the selector matches, once known.
    count: {
      type: Number as PropType<number | null>,
      default: null,
    },
  },

  data(): {
    truncated: boolean;
    maxChars: number;
    resizeObserver: ResizeObserver | null;
  } {
    return { truncated: false, maxChars: Infinity, resizeObserver: null };
  },

  computed: {
    short(): ShortSelector {
      return shortenSelector(this.selector, this.maxChars);
    },

    trimmed(): boolean {
      return (
        this.short.more > 0 ||
        this.short.pieces.some(piece => piece.kind === 'ellipsis')
      );
    },
  },

  mounted() {
    const text = this.$refs.text as HTMLElement;

    this.measureWidth();
    this.resizeObserver = new ResizeObserver(() => this.measureWidth());
    this.resizeObserver.observe(text);
    // Geist Mono can still be swapping in, changing every character's width.
    document.fonts?.ready.then(() => this.measureWidth());
  },

  beforeDestroy() {
    this.resizeObserver?.disconnect();

    // The menu unmounts on select/close, so the pointer/focus leave events
    // may never fire to clear a preview highlight — clear it here.
    this.clearPreview();
  },

  methods: {
    /**
     * How many characters fit on the row. The selector is set in a
     * monospace font, so that's its width over one character's.
     */
    measureWidth(): void {
      const text = this.$refs.text as HTMLElement | undefined;

      if (!text) {
        return;
      }

      const probe = document.createElement('span');
      probe.style.cssText =
        'position: absolute; visibility: hidden; font-family: inherit;';
      probe.textContent = '0'.repeat(20);
      text.appendChild(probe);
      const charWidth = probe.getBoundingClientRect().width / 20;
      probe.remove();

      this.maxChars = charWidth
        ? Math.floor(text.clientWidth / charWidth)
        : Infinity;
    },

    /**
     * Notes whether the selector is cut short, so its tooltip only shows
     * when there's more to read.
     */
    measureTruncation(): void {
      const selector = this.$el.querySelector('.item-selector');

      this.truncated =
        this.trimmed ||
        (!!selector && selector.scrollWidth > selector.clientWidth);
    },

    click(): void {
      this.$emit('select');
    },

    preview(): void {
      getPageBridge().highlight(this.selector);
    },

    // The preview shares the page's single highlight with the dropdown's
    // own active-selector preview, so hand it back once the hover ends.
    clearPreview(): void {
      getPageBridge().unhighlight();
      this.$emit('preview-end');
    },
  },
});
</script>

<style lang="scss" scoped>
.css-selector-dropdown-item {
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.45;

  &:hover,
  &:focus-visible,
  &.current {
    background: var(--field-surface-hover);
    box-shadow: none;
  }
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.item-text {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  contain: inline-size;
  font-family: var(--font-mono);
  color: var(--field-ink);
}

.item-selector {
  @include truncate;

  min-width: 0;
  white-space: pre;
}

.item-more {
  flex: none;
  margin-left: 1ch;
  color: var(--field-placeholder);
}

.item-selector,
.item-more,
.piece {
  font-family: inherit;
}

.separator,
.ellipsis {
  color: var(--field-placeholder);
}

.selector-tooltip {
  font-family: var(--font-mono);
}

.item-count {
  flex: none;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--field-placeholder);
}
</style>
