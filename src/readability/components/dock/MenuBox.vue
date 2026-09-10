<template>
  <div class="menu" :class="{ dense }" :style="{ minWidth: `${minWidth}px` }">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'MenuBox',

  props: {
    dense: {
      type: Boolean,
      default: false,
    },

    // A floor, not a fixed width — the box grows to fit wider content
    // (e.g. the longer Windows-style "Alt+Shift+R" vs. Mac's "⌥⇧R").
    minWidth: {
      type: Number,
      default: 176,
    },
  },
});
</script>

<style lang="scss" scoped>
.menu {
  max-height: calc(100vh - 92px);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--main-background);
  border: 1px solid var(--border-color);
  color: var(--foreground);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
  animation: dock-menu-in 0.16s ease-out;

  &.dense {
    padding: 4px;
    border-radius: 11px;
    gap: 1px;
  }
}

@keyframes dock-menu-in {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
