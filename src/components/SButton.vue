<template>
  <button
    type="button"
    class="button"
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
  name: 'SButton',

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
.button {
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
  color: var(--foreground);
  background: transparent;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
}

.button.default {
  background: var(--background);
  border-color: var(--input);

  &:hover:not(:disabled) {
    background: var(--accent);
  }
}

.button.ghost {
  &:hover:not(:disabled) {
    background: var(--accent);
  }
}

.button.danger {
  color: var(--danger);

  &:hover:not(:disabled) {
    background: var(--danger-background);
  }
}
</style>
