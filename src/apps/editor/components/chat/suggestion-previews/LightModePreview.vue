<template>
  <span class="light-mode"><span class="sun" /></span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'LightModePreview',
});
</script>

<style lang="scss" scoped>
.light-mode {
  background: #f4f2ec;
}

.sun {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: oklch(0.78 0.12 85);
  box-shadow: 0 0 0 5px oklch(0.78 0.12 85 / 30%);
}
</style>
