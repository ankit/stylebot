<template>
  <svg
    viewBox="0 0 16 16"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="2" y="3" width="12" height="10" rx="2" />
    <circle cx="5.8" cy="6.6" r="1.1" />
    <path d="m3 12 3.6-3.4 2.4 2.2 1.8-1.6L14 12" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ImageIcon',

  props: {
    size: {
      type: Number,
      default: 16,
    },
  },
});
</script>
