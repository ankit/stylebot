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
    <path d="M6 3L3 6l3 3" />
    <path d="M3 6h6.5a3.5 3.5 0 0 1 0 7H7" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'UndoIcon',

  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
});
</script>
