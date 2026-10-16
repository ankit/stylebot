<template>
  <svg
    viewBox="0 0 12 12"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M6 2v6.5M3.2 5.8 6 8.6l2.8-2.8M2.5 10.5h7" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'DownloadIcon',

  props: {
    size: {
      type: Number,
      default: 12,
    },
  },
});
</script>
