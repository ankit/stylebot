<template>
  <div
    class="card"
    :class="{ contained }"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <s-heading id="dialog-title" as="h2" size="md">
      {{ title }}
    </s-heading>

    <slot />

    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import SHeading from './SHeading.vue';

export default Vue.extend({
  name: 'SDialogCard',

  components: {
    SHeading,
  },

  props: {
    title: {
      type: String,
      required: true,
    },

    contained: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.card {
  width: 360px;
  max-width: calc(100vw - 32px);
  background: var(--panel-surface);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
  padding: 20px;

  &.contained {
    max-width: 100%;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
