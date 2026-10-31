<template>
  <span class="mark-number" :class="{ small }">{{ n }}</span>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * A mark's number, as its chip and the notes that refer to it show it.
 */
export default Vue.extend({
  name: 'CliMarkNumber',

  props: {
    n: {
      type: Number,
      required: true,
    },
    small: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.mark-number {
  flex: none;
  box-sizing: border-box;
  min-width: 18px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--term-accent);
  color: var(--term-bg);
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;

  &.small {
    min-width: 14px;
    padding: 0 3px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--term-accent) 18%, transparent);
    color: var(--term-accent);
    font-size: 10px;
    font-weight: 600;
    line-height: 14px;
  }
}
</style>
