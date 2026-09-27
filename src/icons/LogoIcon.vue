<template>
  <svg
    viewBox="0 0 28 24"
    :width="size"
    :height="(size * 24) / 28"
    role="img"
    aria-label="Stylebot"
  >
    <rect width="24" height="5" rx="2.5" fill="#ec4d86" />
    <rect y="8.5" width="15" height="5" rx="2.5" fill="#1c9fc4" />
    <rect y="17" width="18" height="5" rx="2.5" fill="#e0a218" />
    <rect x="24.5" y="13" width="3.5" height="11" rx="1.5" fill="#2563eb" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * Stylebot's mark: three bars of styled text and the caret after them.
 */
export default Vue.extend({
  name: 'LogoIcon',

  props: {
    // Width; the height follows the mark's proportions.
    size: {
      type: Number,
      default: 28,
    },
  },
});
</script>
