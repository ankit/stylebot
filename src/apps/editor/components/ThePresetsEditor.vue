<template>
  <div class="presets-editor">
    <the-readability />
    <the-grayscale />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheGrayscale from './presets/TheGrayscale.vue';
import TheReadability from './presets/TheReadability.vue';

export default Vue.extend({
  name: 'ThePresetsEditor',

  components: {
    TheGrayscale,
    TheReadability,
  },

  // Readerability and the body children grayscale attaches to can have
  // changed since the store last looked.
  created() {
    this.$store.dispatch('refreshPage');
  },
});
</script>

<style lang="scss" scoped>
.presets-editor {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 10px;
  padding: 12px;
  background: var(--tab-surface);
}
</style>
