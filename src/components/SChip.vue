<template>
  <span class="chip">
    <slot>{{ label }}</slot>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SChip',

  props: {
    label: {
      type: String,
      default: '',
    },
  },
});
</script>

<style lang="scss" scoped>
.chip {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--hover-tint);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
