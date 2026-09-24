<template>
  <s-card class="feature-card">
    <div class="feature-card-header">
      <heading as="h3" size="sm" :class="{ muted: disabled }">
        {{ label }}
      </heading>
      <slot name="toggle" />
    </div>

    <div class="feature-card-body">
      <slot />
    </div>
  </s-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading, SCard } from '@stylebot/components';

export default Vue.extend({
  name: 'FeatureCard',

  components: {
    Heading,
    SCard,
  },

  props: {
    label: {
      type: String,
      required: true,
    },

    disabled: Boolean,
  },
});
</script>

<style lang="scss" scoped>
.feature-card {
  padding: 14px 16px;
}

.feature-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.feature-card-header .muted {
  color: var(--text-muted);
}

.feature-card-body {
  margin-top: 6px;
}
</style>
