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
    <rect x="1.8" y="2.8" width="12.4" height="10.4" rx="1.2" />
    <path d="M9.8 2.8v10.4" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'DockRightIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
