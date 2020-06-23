<template>
  <div class="stylebot"><stylebot-header /></div>
</template>

<script lang="ts">
import Vue from 'vue';
import StylebotHeader from './components/StylebotHeader.vue';

export default Vue.extend({
  name: 'App',
  components: {
    StylebotHeader,
  },
});
</script>

<style scoped>
.stylebot {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  background: #fff;
  width: 320px;
  z-index: 10000000;
  border: 1px solid #ccc;
  box-shadow: 1px solid #eee;
}
</style>
