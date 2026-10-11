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
        <s-inline-list mono :parts="parts" class="item-text" />
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
import { SInlineList, SMenuItem, SText, STooltip } from '@stylebot/components';
import { splitSelectorList } from '@stylebot/css';

import { getPageBridge } from '@stylebot/page-bridge';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    SInlineList,
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

  data(): { truncated: boolean } {
    return { truncated: false };
  },

  computed: {
    parts(): Array<string> {
      return splitSelectorList(this.selector);
    },
  },

  beforeDestroy() {
    // The menu unmounts on select/close, so the pointer/focus leave events
    // may never fire to clear a preview highlight — clear it here.
    this.clearPreview();
  },

  methods: {
    /**
     * Notes whether the selector is cut short, so its tooltip only shows
     * when there's more to read.
     */
    measureTruncation(): void {
      const text = this.$el.querySelector('.item-text');

      this.truncated = !!text && text.scrollWidth > text.clientWidth;
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
  .keyboard-nav &:focus,
  &.current {
    background: var(--menu-item-hover);
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
  @include truncate;

  display: block;
  contain: inline-size;
}

.selector-tooltip {
  font-family: var(--font-mono);
}

.item-count {
  flex: none;
  font-family: var(--font-mono);
}
</style>
