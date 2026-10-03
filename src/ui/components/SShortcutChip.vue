<template>
  <span class="chip" :class="{ small, muted }">
    <s-shortcut-kbd :small="small" :value="value" :mac="mac" />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import SShortcutKbd from './SShortcutKbd.vue';

export default Vue.extend({
  name: 'SShortcutChip',

  components: {
    SShortcutKbd,
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
  padding: 5px 8px;
  border-radius: 5px;
  background: var(--key-surface);
  box-shadow: 0 0 0 1px var(--key-outline), inset 0 -1px 0 var(--key-edge);
  color: var(--key-ink);

  &.small {
    padding: 5px 6px;
  }

  &.muted {
    background: transparent;
    box-shadow: none;
    color: var(--text-muted);
  }
}
</style>
