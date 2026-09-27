<template>
  <svg
    viewBox="0 0 12 12"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 4.5 6 7.5 9 4.5" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ChevronDownIcon',

  props: {
    size: {
      type: Number,
      default: 12,
    },
  },
});
</script>
