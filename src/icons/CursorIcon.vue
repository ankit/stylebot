<template>
  <svg viewBox="0 0 18 18" :width="size" :height="size" fill="currentColor">
    <path d="M4.5 3.9 14.7 9.3 10.1 10.5 8.6 15.1z" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CursorIcon',

  props: {
    size: {
      type: Number,
      default: 18,
    },
  },
});
</script>
