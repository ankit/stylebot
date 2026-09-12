<template>
  <svg
    viewBox="0 0 16 16"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  >
    <circle cx="7" cy="7" r="4.3" />
    <path d="M10.2 10.2 13.5 13.5" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SearchIcon',

  props: {
    size: {
      type: Number,
      default: 15,
    },
  },
});
</script>
