<template>
  <div class="card"><slot /></div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SCard',
});
</script>

<style lang="scss" scoped>
.card {
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--background);
}
</style>
