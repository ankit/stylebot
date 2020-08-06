<template>
  <div>
    <p class="lead text-muted px-3 pt-3">
      {{ t('magic_mode_description') }}
    </p>

    <div class="mt-4 px-3 magic-section">
      <the-readability />
    </div>

    <div class="mt-5 px-3 pt-4 magic-section">
      <h1 class="magic-title">{{ t('grayscale') }}</h1>
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
  font-size: 14px;
  font-weight: 400;
}

.magic-section {
  // padding: 15px 10px 0 10px;
  border-top: 1px solid #ddd;

  &:first-of-type {
    border: none;
    margin-top: 0;
  }
}
</style>
