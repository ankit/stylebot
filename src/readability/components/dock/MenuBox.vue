<template>
  <div class="menu" :class="{ dense }" :style="{ width: `${width}px` }">
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

    width: {
      type: Number,
      default: 176,
    },
  },
});
</script>

<style lang="scss" scoped>
.menu {
  max-height: calc(100vh - 92px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--main-background);
  border: 1px solid var(--border-color);
  color: var(--main-foreground);
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
