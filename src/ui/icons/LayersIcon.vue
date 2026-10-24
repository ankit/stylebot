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
    <path d="M8 2 14 5 8 8 2 5z" />
    <path d="M2 8l6 3 6-3" />
    <path d="M2 11l6 3 6-3" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'LayersIcon',

  props: {
    size: {
      type: Number,
      default: 16,
    },
  },
});
</script>
