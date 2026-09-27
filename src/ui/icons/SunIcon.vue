<template>
  <svg
    viewBox="0 0 16 16"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
  >
    <circle cx="8" cy="8" r="3" />
    <path
      d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M13 3l-1.1 1.1M4.1 11.9 3 13"
    />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SunIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
