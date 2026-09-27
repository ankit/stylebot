<template>
  <svg
    viewBox="0 0 12 12"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 2.5h5.5V8M9.5 2.5 3 9" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ExternalLinkIcon',

  props: {
    size: {
      type: Number,
      default: 11,
    },
  },
});
</script>
