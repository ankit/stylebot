<template>
  <button
    type="button"
    class="app-button"
    :class="variant"
    :title="title"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
    <slot name="trailing" />
  </button>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

type Variant = 'default' | 'ghost' | 'danger';

export default Vue.extend({
  name: 'AppButton',

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },

    title: {
      type: String,
      default: '',
    },

    variant: {
      type: String as PropType<Variant>,
      default: 'default',
    },
  },
});
</script>

<style lang="scss" scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 15px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  line-height: 1;
  color: var(--ui-fg);
  background: transparent;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid var(--ui-focus-ring);
    outline-offset: 1px;
  }
}

.app-button.default {
  background: var(--ui-bg);
  border-color: var(--ui-icon-btn-border);

  &:hover:not(:disabled) {
    background: var(--ui-hover-bg);
  }
}

.app-button.ghost {
  &:hover:not(:disabled) {
    background: var(--ui-hover-bg);
  }
}

.app-button.danger {
  color: #b3261e;

  &:hover:not(:disabled) {
    background: #fdf1f0;
  }
}
</style>
