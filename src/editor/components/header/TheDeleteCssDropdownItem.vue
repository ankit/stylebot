<template>
  <b-dropdown-item :disabled="disabled" @click="$emit('click')">
    Delete CSS...
  </b-dropdown-item>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheDeleteCssDropdownItem',
  props: ['disabled'],
});
</script>
