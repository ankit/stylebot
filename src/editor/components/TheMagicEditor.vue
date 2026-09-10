<template>
  <div>
    <div class="mt-3 px-3 magic-section">
      <h1 class="magic-title">{{ t('css_generator') }}</h1>
      <the-css-generator />
    </div>

    <div class="mt-4 px-3 magic-section">
      <the-readability />
    </div>

    <div class="mt-4 px-3 magic-section">
      <h1 class="magic-title">{{ t('grayscale') }}</h1>
      <the-grayscale />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheGrayscale from './magic/TheGrayscale.vue';
import TheReadability from './magic/TheReadability.vue';
import TheCssGenerator from './magic/TheCssGenerator.vue';

export default Vue.extend({
  name: 'TheMagicEditor',

  components: {
    TheGrayscale,
    TheReadability,
    TheCssGenerator,
  },
});
</script>

<style lang="scss" scoped>
.magic-title {
  font-size: 14px;
  font-weight: 400;
}

.magic-section {
  &:first-of-type {
    margin-top: 0;
  }
}
</style>
