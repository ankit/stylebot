<template>
  <button type="button" class="menu-item" :class="{ danger }" role="menuitem" @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'MenuItem',

  props: {
    danger: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.menu-item {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: 100%;
  font-weight: 400;
  font-size: 13.5px;
  line-height: 1.3;
  color: var(--foreground);
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: var(--accent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--ring);
  }

  &.danger {
    color: var(--danger);

    &:hover {
      background: var(--danger-background);
    }
  }
}
</style>
