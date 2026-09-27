<template>
  <svg
    viewBox="0 0 14 14"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M8.5 1.5 12.5 5.5 5 13H1.5v-3.5z" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'EyedropperIcon',

  props: {
    size: {
      type: Number,
      default: 13,
    },
  },
});
</script>
