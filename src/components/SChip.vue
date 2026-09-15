<template>
  <span class="chip"><slot /></span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SChip',
});
</script>

<style lang="scss" scoped>
.chip {
  min-width: 0;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--hover-tint);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
</style>
