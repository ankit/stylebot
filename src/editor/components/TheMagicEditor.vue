<template>
  <div class="px-3 py-3">
    <p class="lead text-muted">
      Experimental features. You may need to manually edit elements on the page
      that don't get correctly styled.
    </p>

    <div class="mt-5">
      <the-dark-mode />
    </div>

    <div class="mt-5">
      <the-grayscale />
    </div>

    <div class="mt-5">
      <the-readability />
    </div>

    <div class="mt-5">
      <the-typography />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheDarkMode from './magic/TheDarkMode.vue';
import TheGrayscale from './magic/TheGrayscale.vue';
import TheTypography from './magic/TheTypography.vue';
import TheReadability from './magic/TheReadability.vue';

export default Vue.extend({
  name: 'TheMagicEditor',

  components: {
    TheDarkMode,
    TheGrayscale,
    TheTypography,
    TheReadability,
  },
});
</script>
