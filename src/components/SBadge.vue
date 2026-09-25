<template>
  <span class="badge" :class="variant"><slot /></span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

type Variant = 'accent' | 'muted';

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
  padding: 2px 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}

.badge.accent {
  background: var(--info);
  border-color: var(--info-border);
  color: var(--accent-tint-ink);
}

.badge.muted {
  background: var(--hover-tint);
  color: var(--text-muted);
}
</style>
