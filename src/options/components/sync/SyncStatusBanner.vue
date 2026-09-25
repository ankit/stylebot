<template>
  <div :class="['banner', variant]">
    <slot />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

export type BannerVariant = 'success' | 'error';

export default Vue.extend({
  name: 'SyncStatusBanner',

  props: {
    variant: {
      type: String as PropType<BannerVariant>,
      default: 'success',
    },
  },
});
</script>

<style lang="scss" scoped>
.banner {
  padding: 10px 14px;
  border-radius: 9px;
  font-size: 13px;
  margin-bottom: 16px;
}

.banner.success {
  background: var(--info);
  border: 1px solid var(--info-border);
  color: var(--text-primary);
}

.banner.error {
  background: var(--danger-background);
  border: 1px solid var(--danger-border);
  color: var(--danger);
}
</style>
