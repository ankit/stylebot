<template>
  <svg viewBox="0 0 16 16" :width="size" :height="size" fill="currentColor">
    <path
      fill-rule="evenodd"
      d="M6.9 2.4a1.2 1.2 0 0 1 2.2 0l5.3 9.7a1.2 1.2 0 0 1-1.1 1.8H2.7a1.2 1.2 0 0 1-1.1-1.8zM8 5.7a.7.7 0 0 0-.7.7v2.6a.7.7 0 0 0 1.4 0V6.4A.7.7 0 0 0 8 5.7m0 5.1a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7"
    />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'AlertTriangleIcon',

  props: {
    size: {
      type: Number,
      default: 12,
    },
  },
});
</script>
