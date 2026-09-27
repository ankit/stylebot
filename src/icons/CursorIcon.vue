<template>
  <svg
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
    <path d="M13.5 12.5 21 15l-3.2 1.3L16 20z" fill="currentColor" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CursorIcon',

  props: {
    size: {
      type: Number,
      default: 11,
    },
  },
});
</script>
