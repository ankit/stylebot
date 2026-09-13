<template>
  <s-card class="property-card">
    <button
      type="button"
      class="property-card-header"
      :class="{ collapsed }"
      @click="$emit('toggle')"
    >
      <span class="property-card-label">{{ label }}</span>
      <chevron-down-icon :size="11" class="property-card-chevron" :class="{ collapsed }" />
    </button>

    <div v-show="!collapsed" class="property-card-body">
      <slot />
    </div>
  </s-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { ChevronDownIcon } from '@stylebot/icons';
import { SCard } from '@stylebot/components';

export default Vue.extend({
  name: 'PropertyCard',

  components: {
    ChevronDownIcon,
    SCard,
  },

  props: {
    label: {
      type: String,
      required: true,
    },

    collapsed: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.property-card-header {
  @include button-reset;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px 10px 0 0;
  outline: none;
  cursor: pointer;

  &.collapsed {
    border-radius: 10px;
  }

  @include focus-ring;
}

.property-card-label {
  flex: 1;
  min-width: 0;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  line-height: 1;
  color: var(--foreground-secondary);
}

.property-card-chevron {
  flex: none;
  color: var(--muted-foreground);
  transition: transform 0.15s ease;

  &:not(.collapsed) {
    transform: rotate(180deg);
  }
}

.property-card-body {
  padding: 0 12px 8px;
}

// The final property row in a card drops its divider.
.property-card ::v-deep .property-row:last-child {
  padding-bottom: 2px;
  border-bottom: none;
}
</style>
