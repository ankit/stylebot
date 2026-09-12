<template>
  <button
    type="button"
    class="menu-item"
    :class="{ danger, dense, selected }"
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

    dense: {
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
  width: 100%;
  flex-shrink: 0;
  font-weight: 400;
  font-size: 13.5px;
  line-height: 1.3;
  color: var(--foreground);
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: var(--accent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--ring);
  }

  &.danger {
    color: var(--danger);

    &:hover {
      background: var(--danger-background);
    }
  }

  &.dense {
    padding: 7px 8px;
    font-size: 12.5px;
    border-radius: 6px;
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
