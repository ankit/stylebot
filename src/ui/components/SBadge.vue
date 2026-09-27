<template>
  <span class="badge" :class="variant"><slot /></span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

type Variant = 'accent' | 'muted' | 'success' | 'danger';

export default Vue.extend({
  name: 'SBadge',

  props: {
    variant: {
      type: String as PropType<Variant>,
      default: 'muted',
    },
  },
});
</script>

<style lang="scss" scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  white-space: nowrap;
}

.badge.accent {
  background: var(--info);
  border-color: var(--info-border);
  color: var(--accent-text);
}

.badge.muted {
  background: var(--hover-tint);
  border-color: var(--panel-border);
  color: var(--text-muted);
}

.badge.success {
  background: var(--success-background);
  border-color: var(--success-border);
  color: var(--success);
}

.badge.danger {
  background: var(--danger-background);
  border-color: var(--danger-border);
  color: var(--danger);
}
</style>
