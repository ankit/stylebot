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
    <path d="M8 1.5s5 5.2 5 8.5a5 5 0 0 1-10 0c0-3.3 5-8.5 5-8.5Z" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'DropletIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
