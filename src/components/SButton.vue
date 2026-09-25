<template>
  <button
    type="button"
    class="button"
    :class="[variant, `size-${size}`]"
    :title="title"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
    <slot name="trailing" />
  </button>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';
type Size = 'default' | 'small';

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

    size: {
      type: String as PropType<Size>,
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
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  @include focus-ring;
}

.button.size-small {
  gap: 5px;
  padding: 7px 13px;
  font-size: 12.5px;
}

.button.default {
  background: var(--panel-surface);
  border-color: var(--field-border);

  &:hover:not(:disabled) {
    background: var(--hover-tint);
  }
}

.button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;

  &:hover:not(:disabled) {
    filter: brightness(0.92);
  }
}

.button.ghost {
  &:hover:not(:disabled) {
    background: var(--hover-tint);
  }
}

.button.danger {
  color: var(--danger);

  &:hover:not(:disabled) {
    background: var(--danger-background);
  }
}
</style>
