<template>
  <svg viewBox="0 0 10 10" :width="size" :height="size">
    <rect width="10" height="10" rx="2" fill="currentColor" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'StopIcon',

  props: {
    size: {
      type: Number,
      default: 8,
    },
  },
});
</script>
