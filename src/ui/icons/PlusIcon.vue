<template>
  <svg
    viewBox="0 0 12 12"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
  >
    <path d="M6 2v8M2 6h8" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'PlusIcon',

  props: {
    size: {
      type: Number,
      default: 12,
    },
  },
});
</script>
