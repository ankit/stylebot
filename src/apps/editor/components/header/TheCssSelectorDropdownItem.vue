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
      <s-tooltip :text="selector" :disabled="!trimmed" grow>
        <template #text>
          <span class="selector-tooltip">{{ selector }}</span>
        </template>
        <span ref="text" class="item-text">
          <span class="item-selector">
            <template v-for="(piece, i) in short.pieces">
              <span v-if="piece.kind === 'ellipsis'" :key="i" class="ellipsis">
                <more-icon :size="14" />
              </span>
              <span
                v-else
                :key="i"
                class="piece"
                :class="piece.kind"
                v-text="piece.text"
              />
            </template>
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
import { MoreIcon } from '@stylebot/icons';

import { getPageBridge } from '@stylebot/page-bridge';
import type { ShortSelector } from '../../utils/shorten-selector';
import { shortenSelector } from '../../utils/shorten-selector';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    MoreIcon,
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
    maxChars: number;
    resizeObserver: ResizeObserver | null;
  } {
    return { maxChars: Infinity, resizeObserver: null };
  },

  computed: {
    short(): ShortSelector {
      return shortenSelector(this.selector, this.maxChars);
    },

    // Whether the row shows less than the whole selector, so its tooltip
    // has more to say.
    trimmed(): boolean {
      return this.selector.length > this.maxChars;
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
     * monospace font, so any of its text gives every character's width.
     */
    measureWidth(): void {
      const { text } = this.$refs;
      const piece = this.$el.querySelector('.piece');

      if (!(text instanceof HTMLElement) || !piece?.textContent) {
        return;
      }

      const charWidth =
        piece.getBoundingClientRect().width / piece.textContent.length;

      this.maxChars = Math.floor(text.clientWidth / charWidth) || Infinity;
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

.piece:has(+ .ellipsis) {
  color: var(--text-muted);
}

.ellipsis {
  display: inline-flex;
  margin: 0 0.5ch;
  padding: 1px 5px;
  border-radius: 5px;
  vertical-align: middle;
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
