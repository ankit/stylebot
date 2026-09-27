<template>
  <svg
    viewBox="0 0 14 14"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  >
    <path d="M2 3.5h10M3.7 7h6.5M2.5 10.5h9" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'AlignCenterIcon',

  props: {
    size: {
      type: Number,
      default: 13,
    },
  },
});
</script>
