<template>
  <span class="cozy">
    <span class="pill" />
    <span class="bubble" />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CozyPreview',
});
</script>

<style lang="scss" scoped>
.cozy {
  background: #f5ecdc;
}

.pill {
  width: 30px;
  height: 22px;
  border-radius: 11px;
  background: #c8643e;
  box-shadow: 0 4px 8px rgb(74 52 38 / 28%);
  transform: rotate(-6deg);
}

.bubble {
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background: #fffaf0;
  box-shadow: 0 3px 6px rgb(74 52 38 / 20%);
  transform: translateY(6px);
}
</style>
