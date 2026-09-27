<template>
  <svg
    viewBox="0 0 16 16"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path
      d="M1.5 8c1.5-3 4-4.5 6.5-4.5S13.5 5 14.5 8c-1.5 3-4 4.5-6.5 4.5S2.5 11 1.5 8z"
    />
    <circle cx="8" cy="8" r="1.6" />
    <path d="M2.5 13.5l11-11" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'EyeOffIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
