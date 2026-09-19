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
  min-width: 18px;
  padding: 3px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1;
  color: var(--accent);
  text-align: center;
}
</style>
