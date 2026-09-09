<template>
  <button
    type="button"
    class="icon-button"
    :class="{ bordered }"
    :title="title"
    @click.stop="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'IconButton',

  props: {
    title: {
      type: String,
      default: '',
    },
    // Fixed-size square with a border, for standalone footer buttons (e.g.
    // the "..." more button) rather than an inline dismiss icon.
    bordered: Boolean,
  },
});
</script>

<style lang="scss" scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;

  &:hover {
    background: var(--accent);
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }

  &.bordered {
    flex: none;
    width: 38px;
    padding: 0;
    border: 1px solid var(--input);
    border-radius: 8px;
    color: var(--muted-foreground);
  }
}
</style>
