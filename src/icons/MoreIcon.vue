<template>
  <svg viewBox="0 0 16 16" :width="size" :height="size" fill="currentColor">
    <path
      d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"
    />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'MoreIcon',

  props: {
    size: {
      type: Number,
      default: 18,
    },
  },
});
</script>
