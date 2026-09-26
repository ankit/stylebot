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
    <path d="M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CodeIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
