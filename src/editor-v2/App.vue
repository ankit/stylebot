<template>
  <b-container class="stylebot">
    <the-header />
    <the-basic-editor />
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue';
import TheHeader from './components/TheHeader.vue';
import TheBasicEditor from './components/TheBasicEditor.vue';

export default Vue.extend({
  name: 'App',
  components: {
    TheHeader,
    TheBasicEditor,
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
  z-index: 10000000;
  border: 1px solid #ccc;
  box-shadow: 1px solid #eee;
}
</style>
