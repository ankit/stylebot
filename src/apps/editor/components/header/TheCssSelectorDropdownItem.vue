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
      <s-inline-list mono :parts="parts" class="item-text" />
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
import { SInlineList, SMenuItem } from '@stylebot/components';
import { ArrowUpRightIcon } from '@stylebot/icons';
import { splitSelectorList } from '@stylebot/css';

import { getPageBridge } from '@stylebot/page-bridge';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    SMenuItem,
    ArrowUpRightIcon,
    SInlineList,
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
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.item-text {
  flex: 1;
  min-width: 0;
}

.item-icon {
  flex: none;
  margin-top: 3px;
  color: var(--accent-text);
}
</style>
