<template>
  <svg
    viewBox="0 0 14 14"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M7 12V2.5M3 6.5 7 2.5l4 4" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ArrowUpIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
