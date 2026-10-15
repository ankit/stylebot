<template>
  <span
    class="spinner"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  />
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * A small spinning ring for work in progress, in the colour of the text
 * around it, such as inside a busy button.
 */
export default Vue.extend({
  name: 'SSpinner',

  props: {
    size: {
      type: Number,
      default: 11,
    },
  },
});
</script>

<style lang="scss" scoped>
.spinner {
  flex: none;
  display: inline-block;
  box-sizing: border-box;
  border: 2px solid color-mix(in srgb, currentColor 35%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
