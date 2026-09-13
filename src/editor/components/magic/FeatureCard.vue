<template>
  <div class="feature-card">
    <div class="feature-card-header">
      <heading as="h3" size="sm">{{ label }}</heading>
      <slot name="toggle" />
    </div>

    <div class="feature-card-body">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading } from '@stylebot/components';

export default Vue.extend({
  name: 'FeatureCard',

  components: {
    Heading,
  },

  props: {
    label: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.feature-card {
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--background);
}

.feature-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.feature-card-body {
  margin-top: 6px;
}
</style>
