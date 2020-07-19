<template>
  <div class="px-3 py-3">
    <p class="lead text-muted">
      Experimental features. May not work as expected on all pages.
    </p>

    <div class="mt-5">
      <the-readability />
    </div>

    <div class="mt-5">
      <h1 class="magic-title">Grayscale</h1>
      <the-grayscale />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheGrayscale from './magic/TheGrayscale.vue';
import TheReadability from './magic/TheReadability.vue';

export default Vue.extend({
  name: 'TheMagicEditor',

  components: {
    TheGrayscale,
    TheReadability,
  },
});
</script>

<style lang="scss" scoped>
.magic-title {
  font-size: 16px;
  font-weight: 400;
}
</style>
