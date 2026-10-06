<template>
  <div
    class="card"
    :class="{ contained }"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <h2 id="dialog-title" class="title">{{ title }}</h2>

    <slot />

    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SDialogCard',

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
  width: 420px;
  max-width: calc(100vw - 32px);
  background: var(--panel-surface);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
  padding: 24px;

  &.contained {
    max-width: 100%;
  }
}

.title {
  margin: 0;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.3;
  color: var(--text-primary);
}

.title + .actions {
  margin-top: 28px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
</style>
