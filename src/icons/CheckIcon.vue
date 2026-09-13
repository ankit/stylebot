<template>
  <svg
    viewBox="0 0 12 12"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M2.5 6.3 4.8 8.6 9.5 3.6" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CheckIcon',

  props: {
    size: {
      type: Number,
      default: 12,
    },
  },
});
</script>
