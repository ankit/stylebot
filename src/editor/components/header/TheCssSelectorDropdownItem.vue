<template>
  <menu-item
    class="css-selector-dropdown-item"
    @click="click"
    @mouseenter.native="preview"
    @mouseleave.native="clearPreview"
    @focus.native="preview"
    @blur.native="clearPreview"
  >
    <span class="item-row">
      <span class="chips">
        <s-chip v-for="(part, i) in parts" :key="i">{{ part }}</s-chip>
      </span>
      <s-count-badge
        v-if="styleCount > 0"
        :count="styleCount"
        class="style-count"
      />
    </span>
  </menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { MenuItem, SCountBadge, SChip } from '@stylebot/components';
import { splitSelectorList } from '@stylebot/css';

import { getPageBridge } from '@stylebot/page-bridge';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    MenuItem,
    SCountBadge,
    SChip,
  },

  props: {
    selector: {
      type: String,
      required: true,
    },
    styleCount: {
      type: Number,
      required: true,
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
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.chips {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.style-count {
  margin-top: 2px;
}

.css-selector-dropdown-item:hover .chip,
.css-selector-dropdown-item:focus-visible .chip {
  background: var(--panel-surface);
}
</style>
