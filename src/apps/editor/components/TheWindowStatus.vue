<template>
  <div class="window-status" role="status">
    <span class="window-status-label">{{ t('waiting_for_the_page') }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheWindowStatus',
});
</script>

<style lang="scss" scoped>
.window-status {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--panel-surface);
}

.window-status-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
