<template>
  <!-- prettier-ignore -->
  <component
    :is="clickable ? 'button' : 'span'"
    :type="clickable ? 'button' : undefined"
    class="chip"
    :class="[variant, size, { clickable }]"
    v-on="$listeners"
  ><span class="chip-label"><slot>{{ label }}</slot></span><span v-if="$slots.icon" class="chip-icon"><slot name="icon" /></span></component>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';

/**
 * A short monospace token, such as a selector. It renders as a button when
 * given a click listener; the `icon` slot sits after the label.
 */
export default Vue.extend({
  name: 'SChip',

  props: {
    label: {
      type: String,
      default: '',
    },

    variant: {
      type: String as PropType<'filled' | 'outline' | 'warning'>,
      default: 'filled',
    },

    size: {
      type: String as PropType<'default' | 'small'>,
      default: 'default',
    },
  },

  computed: {
    clickable(): boolean {
      return !!this.$listeners.click;
    },
  },
});
</script>

<style lang="scss" scoped>
.chip {
  @include button-reset;

  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--hover-tint);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);

  &.small {
    border-radius: 5px;
    font-size: 11px;
    line-height: 1.3;
  }

  &.clickable {
    color: var(--text-secondary);
    cursor: pointer;

    &:hover:not(.warning):not(:disabled) {
      color: var(--text-primary);
    }

    @include focus-ring;
  }

  &.outline {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--field-border-selector);

    &.clickable:hover:not(:disabled) {
      background: var(--field-surface-hover);
    }
  }

  &.warning {
    background: var(--warning-background);
    box-shadow: inset 0 0 0 1px var(--warning-border);
    color: var(--warning);
  }
}

.chip-label {
  @include truncate;

  min-width: 0;
  font-family: inherit;
}

.chip-icon {
  flex: none;
  display: inline-flex;
  color: var(--accent-text);

  .warning & {
    color: inherit;
  }
}
</style>
