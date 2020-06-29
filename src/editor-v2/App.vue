<template>
  <b-container class="stylebot">
    <the-header />
    <the-basic-editor />
    <the-footer />
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue';

import TheHeader from './components/TheHeader.vue';
import TheFooter from './components/TheFooter.vue';
import TheBasicEditor from './components/TheBasicEditor.vue';
// import TheAdvancedEditor from './components/TheAdvancedEditor.vue';

export default Vue.extend({
  name: 'App',
  components: {
    TheHeader,
    TheFooter,
    TheBasicEditor,
    // TheAdvancedEditor,
  },
});
</script>

<style scoped>
.stylebot {
  top: 0;
  right: 0;
  height: 100%;
  position: fixed;
  background: #fff;
  width: 350px;
  z-index: 100000000;
  border: 1px solid #ccc;
  box-shadow: 1px solid #eee;
}
</style>
