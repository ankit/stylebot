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
        <span class="item-text">
          <span class="item-head">
            <template v-for="(part, i) in headParts">
              <span
                v-if="i > 0"
                :key="`separator-${i}`"
                class="separator"
                v-text="', '"
              />
              <span :key="i" class="part" v-text="part" />
            </template>
          </span>
          <span class="item-tail" v-text="subject" />
        </span>
      </s-tooltip>
      <arrow-up-right-icon
        v-if="styled && !current"
        :size="12"
        class="item-icon"
      />
    </span>
  </s-menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { SMenuItem, STooltip } from '@stylebot/components';
import { ArrowUpRightIcon } from '@stylebot/icons';
import { getSubjectCompound, splitSelectorList } from '@stylebot/css';

import { getPageBridge } from '@stylebot/page-bridge';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    SMenuItem,
    STooltip,
    ArrowUpRightIcon,
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

    // Whether the style already has a rule for the selector.
    styled: {
      type: Boolean,
      default: false,
    },
  },

  data(): { truncated: boolean } {
    return { truncated: false };
  },

  computed: {
    parts(): Array<string> {
      return splitSelectorList(this.selector);
    },

    // The last part's rightmost compound stays whole; what's before it is
    // cut short with an ellipsis, so a long selector keeps both its ends.
    subject(): string {
      return getSubjectCompound(this.parts[this.parts.length - 1] ?? '');
    },

    headParts(): Array<string> {
      const last = this.parts[this.parts.length - 1] ?? '';

      return [
        ...this.parts.slice(0, -1),
        last.slice(0, last.length - this.subject.length),
      ];
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

      this.truncated = Array.from(text?.children ?? []).some(
        child => child.scrollWidth > child.clientWidth
      );
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
  display: flex;
  flex: 1;
  min-width: 0;
  contain: inline-size;
  font-family: var(--font-mono);
  color: var(--field-ink);
  white-space: pre;
}

.item-head {
  @include truncate;

  flex: 0 1 auto;
  min-width: 0;
  white-space: pre;
}

.item-tail {
  @include truncate;

  flex: none;
  max-width: 100%;
  white-space: pre;
}

.item-head,
.item-tail,
.part,
.separator {
  font-family: inherit;
}

.separator {
  color: var(--field-placeholder);
}

.selector-tooltip {
  font-family: var(--font-mono);
}

.item-icon {
  flex: none;
  color: var(--accent-text);
}
</style>
