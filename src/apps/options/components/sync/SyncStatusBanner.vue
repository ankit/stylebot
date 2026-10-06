<template>
  <div :class="['banner', variant]">
    <div class="message">
      <slot />
    </div>

    <s-icon-button
      v-if="$listeners.dismiss"
      class="dismiss"
      :aria-label="t('dismiss')"
      @click="$emit('dismiss')"
    >
      <x-icon :size="16" />
    </s-icon-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SIconButton } from '@stylebot/components';
import { XIcon } from '@stylebot/icons';

export type BannerVariant = 'success' | 'error';

export default Vue.extend({
  name: 'SyncStatusBanner',

  components: {
    SIconButton,
    XIcon,
  },

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
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 9px;
  font-size: 13px;
  margin-bottom: 16px;
}

.message {
  flex: 1;
  min-width: 0;
}

.dismiss {
  margin: -1px -6px -1px 0;
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
