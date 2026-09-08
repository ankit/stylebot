<template>
  <span class="chip" :class="{ small }">
    <shortcut-kbd :small="small" :value="value" />
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
  },
});
</script>

<style lang="scss" scoped>
.chip {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
  border-radius: 5px;
  padding: 4px 8px;

  &.small {
    padding: 5px 5px;
  }
}
</style>
