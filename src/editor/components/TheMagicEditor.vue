<template>
  <div>
    <div class="mt-3 px-3 magic-section">
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
  &:first-of-type {
    margin-top: 0;
  }
}
</style>
