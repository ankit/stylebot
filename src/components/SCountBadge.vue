<template>
  <span class="count-badge">{{ count }}</span>
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
  border-radius: 20px;
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--primary);
  min-width: 18px;
  text-align: center;
}
</style>
