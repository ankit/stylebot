<template>
  <span class="count-badge">
    <slot>{{ count }}</slot>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SCountBadge',

  props: {
    count: {
      type: Number,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.count-badge {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--count-badge-surface);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0;
  color: var(--count-badge-ink);
  text-align: center;
}
</style>
