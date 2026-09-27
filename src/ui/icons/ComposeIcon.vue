<template>
  <svg
    viewBox="0 0 16 16"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path
      d="M13.5 8.5v4a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 12.5V4A1.5 1.5 0 0 1 4 2.5h4"
    />
    <path d="M11.8 1.8a1.3 1.3 0 0 1 1.9 1.9L8.3 9.1 6 9.7l.6-2.3z" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ComposeIcon',

  props: {
    size: {
      type: Number,
      default: 15,
    },
  },
});
</script>
