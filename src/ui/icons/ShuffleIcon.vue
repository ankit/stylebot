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
    <path d="M2 4.5h2.5c3.5 0 4 7 7.5 7h2" />
    <path d="M2 11.5h2.5c1.2 0 2-.8 2.7-1.9M9.3 6.4c.7-1.1 1.5-1.9 2.7-1.9h2" />
    <path d="M12.5 2.8 14 4.5l-1.5 1.7M12.5 9.8 14 11.5l-1.5 1.7" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ShuffleIcon',

  props: {
    size: {
      type: Number,
      default: 12,
    },
  },
});
</script>
