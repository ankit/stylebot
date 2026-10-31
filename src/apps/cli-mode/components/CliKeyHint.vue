<template>
  <span class="key-hint">
    <span class="key">[{{ shortcut }}]</span>
    <slot />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * A label after the key that does the same, e.g. "[z] undo".
 */
export default Vue.extend({
  name: 'CliKeyHint',

  props: {
    shortcut: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.key-hint {
  display: inline-flex;
  gap: 1ch;
  white-space: nowrap;
}

.key {
  color: var(--term-faint);
}
</style>
