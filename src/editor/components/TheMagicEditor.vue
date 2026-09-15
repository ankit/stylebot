<template>
  <div class="magic-editor">
    <the-readability />
    <the-grayscale />
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
.magic-editor {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 10px;
  padding: 12px;
  background: var(--tab-surface);
}
</style>
