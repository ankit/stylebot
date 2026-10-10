<template>
  <div
    class="card"
    :class="[{ contained }, size]"
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
import type { PropType } from 'vue';
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

    size: {
      type: String as PropType<'default' | 'small'>,
      default: 'default',
    },
  },
});
</script>

<style lang="scss" scoped>
.card {
  width: 480px;
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  background: var(--panel-surface);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(20, 22, 26, 0.12);
  padding: 24px;

  @include dark-mode {
    border: 1px solid var(--menu-border);
    background: var(--menu-surface);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  }

  &.contained {
    max-width: 100%;
  }
}

.title {
  margin: 0;
  font-weight: 600;
  font-size: 18px;
  line-height: 1.3;
  text-wrap: pretty;
  color: var(--text-primary);

  .small & {
    font-size: 15px;
  }
}

.title + .actions {
  margin-top: 24px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
</style>
