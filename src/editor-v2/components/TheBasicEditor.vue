<template>
  <div class="stylebot-basic-editor">
    <h1>Text</h1>
    <the-text-properties />

    <div class="stylebot-basic-editor-section">
      <h1>Colors and Background</h1>
      <the-color-properties />
    </div>

    <div class="stylebot-basic-editor-section">
      <h1>Border</h1>
    </div>

    <div class="stylebot-basic-editor-section">
      <h1>Layout and Visibility</h1>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheTextProperties from './TheTextProperties.vue';
import TheColorProperties from './TheColorProperties.vue';

export default Vue.extend({
  name: 'TheBasicEditor',
  components: {
    TheTextProperties,
    TheColorProperties,
  },
});
</script>

<style scoped>
.stylebot-basic-editor {
  padding: 20px 10px;
}
.stylebot-basic-editor-section {
  margin-top: 30px;
  border-top: 1px solid #ddd;
  padding-top: 15px;
  margin-left: -25px;
  margin-right: -25px;
  padding: 15px 25px 0 25px;
}
</style>
