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
    <path d="M13.2 10.2A5.6 5.6 0 0 1 5.8 2.8 5.6 5.6 0 1 0 13.2 10.2z" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'MoonIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
