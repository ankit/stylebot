<template>
  <svg
    viewBox="0 0 16 16"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path
      d="M5.4 4.6V3a1.2 1.2 0 0 1 1.2-1.2H13a1.2 1.2 0 0 1 1.2 1.2v6.4a1.2 1.2 0 0 1-1.2 1.2h-1.6"
    />
    <rect x="1.8" y="5.4" width="8.8" height="8.8" rx="1.2" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'UndockIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
