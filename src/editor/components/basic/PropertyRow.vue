<template>
  <div class="property-row" :class="{ last }">
    <s-text size="label" variant="muted" class="property-row-label">{{ label }}</s-text>
    <div class="property-row-control"><slot /></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText } from '@stylebot/components';

export default Vue.extend({
  name: 'PropertyRow',

  components: {
    SText,
  },

  props: {
    label: {
      type: String,
      required: true,
    },

    // Drops the bottom divider on the last row in a card.
    last: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.property-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 7%, transparent);

  &.last {
    padding-bottom: 2px;
    border-bottom: none;
  }
}

.property-row-label {
  flex: 1 0 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.property-row-control {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 108px;
}
</style>
