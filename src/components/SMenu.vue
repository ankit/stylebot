<template>
  <div
    class="menu"
    role="menu"
    tabindex="-1"
    :class="{ dense }"
    :style="{ minWidth: `${minWidth}px`, maxHeight: maxHeight ? `${maxHeight}px` : undefined }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SMenu',

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

    // Caps the menu's height (px) and makes it scroll instead of growing
    // unbounded. Omit to fall back to the viewport-relative default.
    maxHeight: {
      type: Number,
      default: 0,
    },
  },
});
</script>

<style lang="scss" scoped>
.menu {
  --menu-padding: 12px;
  --menu-item-padding-y: 10px;
  --menu-item-font-size: 13.5px;

  max-height: calc(100vh - 92px);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--menu-padding);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--menu-surface);
  border: 1px solid var(--menu-border);
  color: var(--text-primary);
  box-shadow: 0 6px 16px var(--menu-shadow);
  animation: dock-menu-in 0.16s ease-out;

  &.dense {
    --menu-padding: 4px;
    --menu-item-padding-y: 7px;
    --menu-item-font-size: 12.5px;
    padding: var(--menu-padding);
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
