<template>
  <svg
    viewBox="0 0 18 18"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
  >
    <path
      d="M2.5 6a1.5 1.5 0 0 1 1.5-1.5h2l1.2-1.7h3.6l1.2 1.7h2A1.5 1.5 0 0 1 15.5 6v7a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 13z"
    />
    <circle cx="9" cy="9.5" r="2.7" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CameraIcon',

  props: {
    size: {
      type: Number,
      default: 18,
    },
  },
});
</script>
