<template>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="none">
    <rect class="track" x="1" y="6" width="22" height="12" rx="6" />
    <circle class="thumb" cx="17" cy="12" r="4" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({ name: 'IconToggle' });
</script>

<style lang="scss" scoped>
.track {
  fill: currentColor;
}

.thumb {
  fill: var(--main-background);
}
</style>
