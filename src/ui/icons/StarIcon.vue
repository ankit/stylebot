<template>
  <svg viewBox="0 0 16 16" :width="size" :height="size" fill="currentColor">
    <path
      d="M8 1.2l2.03 4.3 4.7.6-3.45 3.25.88 4.65L8 11.72 3.84 14l.88-4.65L1.27 6.1l4.7-.6z"
    />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'StarIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
