<template>
  <div class="menu-divider" role="separator" />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SMenuDivider',
});
</script>

<style lang="scss" scoped>
.menu-divider {
  flex: none;
  height: 1px;
  margin: 0 2px 2px;
  background: var(--panel-border);
}
</style>
