<template>
  <s-card class="property-card">
    <button type="button" class="property-card-header" @click="$emit('toggle')">
      <span class="property-card-title">
        <span class="property-card-label">{{ label }}</span>
        <s-count-badge v-if="count > 0" :count="count" />
      </span>
      <chevron-down-icon :size="11" class="property-card-chevron" :class="{ collapsed }" />
    </button>

    <div class="property-card-collapse" :class="{ collapsed }" :inert="collapsed">
      <div class="property-card-body">
        <slot />
      </div>
    </div>
  </s-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { ChevronDownIcon } from '@stylebot/icons';
import { SCard, SCountBadge } from '@stylebot/components';

export default Vue.extend({
  name: 'PropertyCard',

  components: {
    ChevronDownIcon,
    SCard,
    SCountBadge,
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

    count: {
      type: Number,
      default: 0,
    },
  },
});
</script>

<style lang="scss" scoped>
.property-card {
  --panel-surface: var(--card-surface);
}

.property-card-header {
  @include button-reset;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  outline: none;
  cursor: pointer;

  @include focus-ring;
}

.property-card-title {
  flex: 1;
  min-width: 0;
  min-height: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-card-label {
  flex: none;
  min-width: 0;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  line-height: 1;
  color: var(--text-secondary);
}

.property-card-chevron {
  flex: none;
  color: var(--text-muted);
  transition: transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);

  &:not(.collapsed) {
    transform: rotate(180deg);
  }
}

.property-card-collapse {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.24s cubic-bezier(0.4, 0, 0.2, 1);

  &.collapsed {
    grid-template-rows: 0fr;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.property-card-body {
  min-height: 0;
  overflow: hidden;
  padding: 0 12px 8px;
  opacity: 1;
  transition: padding-bottom 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.16s ease 0.08s;

  .property-card-collapse.collapsed & {
    padding-bottom: 0;
    opacity: 0;
    transition: padding-bottom 0.24s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.1s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

// The final property row in a card drops its divider.
.property-card ::v-deep .property-row:last-child {
  padding-bottom: 2px;
  border-bottom: none;
}
</style>
