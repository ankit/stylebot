<template>
  <span class="wabi-sabi"><span class="enso" /></span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'WabiSabiPreview',
});
</script>

<style lang="scss" scoped>
.wabi-sabi {
  background: #f7f6f2;
}

.enso {
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  border: 4px solid #d9472b;
  border-right-color: transparent;
  border-radius: 50%;
  transform: rotate(-30deg);
}
</style>
