<template>
  <div class="property-row" :class="{ last }">
    <div class="property-row-label">{{ label }}</div>
    <div class="property-row-control"><slot /></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'PropertyRow',

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
  border-bottom: 1px solid color-mix(in srgb, var(--foreground) 7%, transparent);

  &.last {
    padding-bottom: 2px;
    border-bottom: none;
  }
}

.property-row-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 1.3;
  color: var(--muted-foreground);
}

.property-row-control {
  flex: none;
  display: flex;
  justify-content: flex-end;
  min-width: 108px;
}
</style>
