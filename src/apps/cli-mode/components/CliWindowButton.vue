<template>
  <button
    type="button"
    class="window-button"
    :title="title"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * A square icon button on the terminal, like a window's minimize or close.
 */
export default Vue.extend({
  name: 'CliWindowButton',

  props: {
    title: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.window-button {
  display: grid;
  flex: none;
  place-items: center;
  width: 26px;
  height: 26px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--term-dim);
  font: inherit;
  appearance: none;
  cursor: pointer;

  &:hover {
    background: var(--term-raised);
    color: var(--term-bright);
  }

  &:focus-visible {
    outline: 1px solid var(--term-accent);
    outline-offset: 0;
  }

  ::v-deep svg {
    display: block;
  }
}
</style>
