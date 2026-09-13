<template>
  <button
    type="button"
    class="menu-item"
    :class="{ danger, selected }"
    role="menuitem"
    @click="$emit('click', $event)"
  >
    <span class="menu-item-content"><slot /></span>
    <check-icon v-if="selected" :size="12" class="menu-item-check" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

import { CheckIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'MenuItem',

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
  font-size: var(--menu-item-font-size, 13.5px);
  line-height: 1.3;
  color: var(--foreground);
  margin: 0 calc(-1 * var(--menu-padding, 12px));
  padding: var(--menu-item-padding-y, 10px) 12px;
  border-radius: 0;
  outline: none;
  cursor: pointer;

  &:hover,
  &:focus,
  &:focus-visible {
    outline: none;
    background: var(--accent);
    box-shadow: inset 4px 0 0 var(--primary);
  }

  &.danger {
    color: var(--danger);

    &:hover,
    &:focus-visible {
      background: var(--danger-background);
    }
  }

  &.selected {
    background: color-mix(in srgb, var(--primary) 8%, transparent);
  }
}

.menu-item-content {
  flex: 1;
  min-width: 0;
}

.menu-item-check {
  flex: none;
  color: var(--primary);
}
</style>
