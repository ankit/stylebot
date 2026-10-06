<template>
  <span class="swiss-poster">
    <span class="disc" />
    <span class="rule" />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SwissPosterPreview',
});
</script>

<style lang="scss" scoped>
.swiss-poster {
  background: #fff;
}

.disc {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e3262b;
  transform: translateX(6px);
}

.rule {
  width: 8px;
  height: 40px;
  background: #111;
  transform: translateX(-12px);
}
</style>
