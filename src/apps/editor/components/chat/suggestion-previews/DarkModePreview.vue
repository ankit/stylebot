<template>
  <span class="dark-mode"><span class="moon" /></span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'DarkModePreview',
});
</script>

<style lang="scss" scoped>
.dark-mode {
  background: #1c1d20;
}

.moon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  box-shadow: inset -7px -3px 0 0 oklch(0.78 0.12 260);
  transform: rotate(-20deg);
}
</style>
