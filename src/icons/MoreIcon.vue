<template>
  <svg viewBox="0 0 16 16" :width="size" :height="size" fill="currentColor">
    <circle cx="3" cy="8" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="13" cy="8" r="1.5" />
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
