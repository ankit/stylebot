<template>
  <span class="chip" :class="{ small, muted }">
    <shortcut-kbd :small="small" :value="value" :mac="mac" />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import ShortcutKbd from './ShortcutKbd.vue';

export default Vue.extend({
  name: 'ShortcutChip',

  components: {
    ShortcutKbd,
  },

  props: {
    value: {
      type: String,
      required: true,
    },

    small: {
      type: Boolean,
      default: false,
    },

    // No background/border — just muted-colored keys, for contexts (like a
    // button) that already provide their own surface.
    muted: {
      type: Boolean,
      default: false,
    },

    // Forces macOS vs non-Mac rendering; left unset to auto-detect.
    mac: {
      type: Boolean,
      default: undefined,
    },
  },
});
</script>

<style lang="scss" scoped>
.chip {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  background: var(--key-fill);
  border: 1px solid var(--field-border);
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 4px 8px;

  &.small {
    padding: 5px 5px;
  }

  &.muted {
    background: transparent;
    border-color: transparent;
    color: var(--text-muted);
  }

  &:not(.muted) ::v-deep kbd svg {
    margin-top: -2px;
  }
}
</style>
