<template>
  <b-col cols="5" align-self="center" class="stylebot-css-property">
    <slot />
  </b-col>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CssProperty',
});
</script>

<style scoped>
.stylebot-css-property {
  font-size: 12px;
  text-align: right;
  padding-right: 16px !important;
}
</style>
