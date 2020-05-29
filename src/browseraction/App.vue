<template>
  <p>{{ message }}</p>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'App',
  data() {
    return {
      message: 'My new tab page',
    };
  },
});
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
