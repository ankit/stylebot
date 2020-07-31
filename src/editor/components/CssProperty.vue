<template>
  <b-col cols="4" align-self="center" class="css-property">
    <slot />
  </b-col>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CssProperty',
});
</script>

<style lang="scss" scoped>
.css-property {
  font-size: 12px;
  text-align: right;
  padding-left: 0 !important;
  padding-right: 15px !important;
}
</style>
