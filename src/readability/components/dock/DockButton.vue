<template>
  <button
    class="btn"
    @click="$emit('click')"
    @mouseenter="$emit('hover', $event)"
    @mouseleave="$emit('unhover')"
  >
    <slot />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'DockButton',
});
</script>

<style lang="scss" scoped>
.btn {
  all: unset;
  box-sizing: border-box;
  width: 38px;
  height: 38px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--muted-foreground);
  transition: color 0.18s ease, background-color 0.18s ease;

  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--main-foreground);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--link-color);
  }
}
</style>
