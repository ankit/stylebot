<template>
  <svg
    viewBox="0 0 16 16"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M6.5 3.5 11 8l-4.5 4.5" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ChevronRightIcon',

  props: {
    size: {
      type: Number,
      default: 18,
    },
  },
});
</script>
