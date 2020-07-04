<template>
  <div class="px-3 py-3">
    <h1>Text</h1>
    <the-text-properties />

    <div class="stylebot-basic-editor-section">
      <h1>Colors and Background</h1>
      <the-color-properties />
    </div>

    <div class="stylebot-basic-editor-section">
      <h1>Layout and Visibility</h1>
      <the-layout-properties />
    </div>

    <div class="stylebot-basic-editor-section">
      <h1>
        Magic
        <span class="text-muted">alpha</span>
        <the-magic-properties />
      </h1>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheTextProperties from './TheTextProperties.vue';
import TheColorProperties from './TheColorProperties.vue';
import TheLayoutProperties from './TheLayoutProperties.vue';
import TheMagicProperties from './TheMagicProperties.vue';

export default Vue.extend({
  name: 'TheBasicEditor',
  components: {
    TheTextProperties,
    TheColorProperties,
    TheLayoutProperties,
    TheMagicProperties,
  },
});
</script>

<style lang="scss" scoped>
.stylebot-basic-editor-section {
  padding: 15px 10px 0 10px;
  margin: 30px -16px 0 -16px;
  border-top: 1px solid #ddd;
}
</style>
