<template>
  <s-menu-item
    class="css-selector-dropdown-item"
    :class="{ current }"
    :selected="current"
    :check="false"
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
          <span ref="selector" class="item-selector">
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
      <s-text
        v-if="count"
        as="span"
        size="caption"
        variant="muted"
        class="item-count"
        :aria-label="
          t(count === 1 ? 'matches_count_one' : 'matches_count_other', [
            String(count),
          ])
        "
      >
        {{ count }}
      </s-text>
    </span>
  </s-menu-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SMenuItem, SText, STooltip } from '@stylebot/components';

import { getPageBridge } from '@stylebot/page-bridge';
import type { ShortSelector } from '../../utils/short-selector';
import { shortenSelector } from '../../utils/short-selector';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    SMenuItem,
    SText,
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
    const { text } = this.$refs;

    if (text instanceof HTMLElement) {
      this.resizeObserver = new ResizeObserver(() => this.measureWidth());
      this.resizeObserver.observe(text);
    }
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
     * monospace font, so any of its characters gives the width of all.
     */
    measureWidth(): void {
      const { text, selector } = this.$refs;

      if (
        !(text instanceof HTMLElement) ||
        !(selector instanceof HTMLElement)
      ) {
        return;
      }

      const charWidth =
        selector.scrollWidth / (selector.textContent?.length || 1);

      this.maxChars = Math.floor(text.clientWidth / charWidth) || Infinity;
    },

    /**
     * Notes whether the selector is cut short, so its tooltip only shows
     * when there's more to read.
     */
    measureTruncation(): void {
      const { selector } = this.$refs;

      this.truncated =
        this.trimmed ||
        (selector instanceof HTMLElement &&
          selector.scrollWidth > selector.clientWidth);
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

.separator {
  color: var(--field-placeholder);
}

.ellipsis {
  display: inline-block;
  margin: 0 0.5ch;
  padding: 0 3px;
  border-radius: 4px;
  line-height: 1.3;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--text-primary) 8%, transparent);
}

.selector-tooltip {
  font-family: var(--font-mono);
}

.item-count {
  flex: none;
  font-family: var(--font-mono);
}
</style>
