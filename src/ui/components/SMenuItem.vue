<template>
  <button
    type="button"
    class="menu-item"
    :class="{ danger, selected }"
    role="menuitem"
    tabindex="-1"
    :disabled="disabled"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="$emit('click', $event)"
  >
    <span class="menu-item-content"><slot /></span>
    <check-icon v-if="selected && check" :size="12" class="menu-item-check" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

import { CheckIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'SMenuItem',

  components: {
    CheckIcon,
  },

  props: {
    danger: {
      type: Boolean,
      default: false,
    },

    // Marks the item as the current choice — shows a trailing check.
    selected: {
      type: Boolean,
      default: false,
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    // Off for a list that marks its selected item some other way.
    check: {
      type: Boolean,
      default: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.menu-item {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  font-weight: 400;
  font-size: var(--menu-item-font-size, 13px);
  line-height: 1.3;
  color: var(--text-primary);
  padding: var(--menu-item-padding-y, 10px) 10px;
  border-radius: 6px;
  outline: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: var(--field-surface-hover);
  }

  &.danger {
    color: var(--danger);

    &:hover,
    &:focus-visible {
      background: var(--danger-background);
    }
  }

  &:disabled {
    color: var(--text-faint);
    cursor: default;

    &:hover {
      background: none;
    }
  }
}

.menu-item-content {
  flex: 1;
  min-width: 0;
}

.menu-item-check {
  flex: none;
  align-self: flex-start;
  margin-top: 3px;
  color: var(--accent-text);
}
</style>
