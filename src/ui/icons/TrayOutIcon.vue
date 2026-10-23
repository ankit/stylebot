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
    <path d="M8 9V2M5 5l3-3 3 3M2.5 9.5v3a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TrayOutIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
