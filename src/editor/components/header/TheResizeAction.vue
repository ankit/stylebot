<template>
  <b-button :title="`${t('resize')}`" variant="sm">
    <b-icon icon="arrows-expand" rotate="90" />
  </b-button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheResizeAction',
});
</script>
