<template>
  <svg
    viewBox="0 0 16 16"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 3h4l4 9h4" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'OptionKeyIcon',

  props: {
    size: {
      type: Number,
      default: 12,
    },
  },
});
</script>
