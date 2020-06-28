<template>
  <b-col cols="7">
    <slot />
  </b-col>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CssPropertyValue',
});
</script>
