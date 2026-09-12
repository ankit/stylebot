<template>
  <anchored-menu class="select" :class="{ 'full-width': fullWidth }">
    <template #trigger="{ toggle, open }">
      <button
        type="button"
        class="select-trigger"
        :class="{ muted, open }"
        :disabled="disabled"
        @click="toggle"
      >
        <span class="select-value">{{ text }}</span>
        <chevron-down-icon :size="10" class="select-chevron" :class="{ open }" />
      </button>
    </template>

    <template #default="{ close }">
      <s-menu dense :min-width="menuMinWidth">
        <slot :close="close" />
      </s-menu>
    </template>
  </anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { ChevronDownIcon } from '@stylebot/icons';

import AnchoredMenu from './AnchoredMenu.vue';
import SMenu from './SMenu.vue';

export default Vue.extend({
  name: 'SSelect',

  components: {
    AnchoredMenu,
    SMenu,
    ChevronDownIcon,
  },

  props: {
    // Text shown in the trigger.
    text: {
      type: String,
      default: '',
    },

    // Render the trigger text muted (e.g. for an unset / placeholder value).
    muted: {
      type: Boolean,
      default: false,
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    // Stretch the trigger to fill its container instead of hugging content.
    fullWidth: {
      type: Boolean,
      default: false,
    },

    menuMinWidth: {
      type: Number,
      default: 108,
    },
  },
});
</script>

<style lang="scss" scoped>
.select {
  display: flex;
}

.select.full-width {
  flex: 1;

  .select-trigger {
    width: 100%;
  }
}

.select-trigger {
  @include button-reset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 108px;
  padding: 5px 8px;
  border: 1px solid var(--input);
  border-radius: 7px;
  font-size: 12.5px;
  line-height: 1.2;
  color: var(--foreground);
  cursor: pointer;

  &.muted {
    color: var(--muted-foreground);
  }

  &:hover:not(:disabled) {
    border-color: var(--muted-foreground);
  }

  &.open {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  @include focus-ring;
}

.select-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-chevron {
  flex: none;
  color: var(--muted-foreground);
  transition: transform 0.15s ease;

  &.open {
    transform: rotate(180deg);
  }
}
</style>
